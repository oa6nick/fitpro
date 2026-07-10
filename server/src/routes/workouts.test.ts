import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { clients, exercises, users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";

const app = createApp();

let trainer: request.Agent;
let client: request.Agent;
let clientId: string;
let exerciseId: string;
let workoutId: string;
let weId: string;

/** Тренер + клиент с привязанным аккаунтом + тренировка с одним упражнением (3 подхода). */
beforeAll(async () => {
  trainer = request.agent(app);
  const reg = await trainer
    .post("/api/auth/register")
    .send({ email: "wt-trainer@test.ru", password: "secret1", name: "Тренер" });
  const trainerId = reg.body.user.id;

  const created = await trainer.post("/api/clients").send({ name: "Клиент дневника" });
  clientId = created.body.client.id;

  // Аккаунт клиента и привязка к карточке.
  const [clientUser] = await db
    .insert(users)
    .values({
      email: "wt-client@test.ru",
      passwordHash: await hashPassword("secret1"),
      name: "Клиент дневника",
      role: "client",
    })
    .returning();
  await db.update(clients).set({ userId: clientUser!.id }).where(eq(clients.id, clientId));

  const [ex] = await db
    .insert(exercises)
    .values({ trainerId, name: "Присед" })
    .returning();
  exerciseId = ex!.id;

  const w = await trainer
    .post("/api/workouts")
    .send({ clientId, title: "День ног", exercises: [{ exerciseId, sets: 3, reps: "10" }] });
  workoutId = w.body.workout.id;

  client = request.agent(app);
  await client.post("/api/auth/login").send({ email: "wt-client@test.ru", password: "secret1" });

  const detail = await client.get(`/api/workouts/${workoutId}`);
  weId = detail.body.items[0].id;
});

describe("дневник: отметка подходов", () => {
  it("первая отметка создаёт лог (201), повторная обновляет его (200) — без дублей", async () => {
    const first = await client
      .post(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: weId, setNumber: 1, weight: 100, reps: 10, feeling: "moderate" });
    expect(first.status).toBe(201);

    const again = await client
      .post(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: weId, setNumber: 1, weight: 105, reps: 8, feeling: "hard" });
    expect(again.status).toBe(200);

    const detail = await client.get(`/api/workouts/${workoutId}`);
    const logs = detail.body.items[0].logs;
    expect(logs).toHaveLength(1);
    expect(logs[0].weight).toBe(105);
    expect(logs[0].reps).toBe(8);
  });

  it("снятие отметки удаляет лог", async () => {
    await client
      .post(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: weId, setNumber: 2, weight: 50, reps: 12 });
    let detail = await client.get(`/api/workouts/${workoutId}`);
    expect(detail.body.items[0].logs).toHaveLength(2);

    const del = await client
      .delete(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: weId, setNumber: 2 });
    expect(del.status).toBe(200);

    detail = await client.get(`/api/workouts/${workoutId}`);
    expect(detail.body.items[0].logs).toHaveLength(1);
  });

  it("подход в чужую тренировку не пишется (404)", async () => {
    const res = await client
      .post(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: "00000000-0000-0000-0000-000000000000", setNumber: 1 });
    expect(res.status).toBe(404);
  });
});

describe("завершение тренировки", () => {
  it("считает тоннаж Σ(вес×повторы) и сохраняет самочувствие с комментарием", async () => {
    // Сейчас записан один подход: 105 × 8 = 840. Добавим второй: 100 × 10 = 1000.
    await client
      .post(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: weId, setNumber: 2, weight: 100, reps: 10 });

    const res = await client
      .patch(`/api/workouts/${workoutId}/status`)
      .send({ status: "completed", feeling: "hard", comment: "Болело колено" });

    expect(res.status).toBe(200);
    expect(res.body.workout.tonnage).toBe(1840);
    expect(res.body.workout.clientFeeling).toBe("hard");
    expect(res.body.workout.clientComment).toBe("Болело колено");
    expect(res.body.workout.status).toBe("completed");
  });

  it("тренер видит логи и тоннаж клиента", async () => {
    const res = await trainer.get(`/api/workouts/${workoutId}`);
    expect(res.status).toBe(200);
    expect(res.body.workout.tonnage).toBe(1840);
    expect(res.body.items[0].logs.length).toBeGreaterThan(0);
  });

  it("завершение клиентом ставит тренировку в очередь на проверку", async () => {
    const res = await trainer.get(`/api/workouts/${workoutId}`);
    expect(res.body.workout.reviewStatus).toBe("pending");
  });
});

describe("проверка тренером", () => {
  it("дашборд считает непроверенные тренировки и отдаёт список", async () => {
    const res = await trainer.get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.counts.unreviewed).toBe(1);
    expect(res.body.unreviewed[0].clientName).toBe("Клиент дневника");
  });

  it("клиент не может проверить тренировку (403)", async () => {
    const res = await client.patch(`/api/workouts/${workoutId}/review`).send({ comment: "я сам" });
    expect(res.status).toBe(403);
  });

  it("тренер проверяет с комментарием → reviewed, счётчик обнуляется", async () => {
    const res = await trainer
      .patch(`/api/workouts/${workoutId}/review`)
      .send({ comment: "Отличная работа, добавим вес" });
    expect(res.status).toBe(200);
    expect(res.body.workout.reviewStatus).toBe("reviewed");
    expect(res.body.workout.trainerComment).toBe("Отличная работа, добавим вес");
    expect(res.body.workout.reviewedAt).toBeTruthy();

    const dash = await trainer.get("/api/dashboard");
    expect(dash.body.counts.unreviewed).toBe(0);

    // Клиент видит комментарий тренера.
    const mine = await client.get(`/api/workouts/${workoutId}`);
    expect(mine.body.workout.trainerComment).toBe("Отличная работа, добавим вес");
  });
});
