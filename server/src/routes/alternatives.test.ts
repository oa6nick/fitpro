import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { clients, users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";

const app = createApp();

let trainer: request.Agent;
let client: request.Agent;
let squatId: string;
let legPressId: string;
let benchId: string;
let workoutId: string;
let weId: string;

beforeAll(async () => {
  trainer = request.agent(app);
  await trainer
    .post("/api/auth/register")
    .send({ email: "alt-trainer@test.ru", password: "secret1", name: "Тренер" });

  const mk = async (name: string) => {
    const r = await trainer.post("/api/exercises").send({ name });
    return r.body.exercise.id as string;
  };
  squatId = await mk("Присед со штангой");
  legPressId = await mk("Жим ногами");
  benchId = await mk("Жим лёжа");

  const created = await trainer.post("/api/clients").send({ name: "Клиент замен" });
  const clientId = created.body.client.id;
  const [clientUser] = await db
    .insert(users)
    .values({
      email: "alt-client@test.ru",
      passwordHash: await hashPassword("secret1"),
      name: "Клиент замен",
      role: "client",
    })
    .returning();
  await db.update(clients).set({ userId: clientUser!.id }).where(eq(clients.id, clientId));

  const w = await trainer.post("/api/workouts").send({
    clientId,
    title: "Ноги",
    exercises: [{ exerciseId: squatId, sets: 3, reps: "10", groupKey: "g1", groupType: "superset" }],
  });
  workoutId = w.body.workout.id;

  client = request.agent(app);
  await client.post("/api/auth/login").send({ email: "alt-client@test.ru", password: "secret1" });
  const detail = await client.get(`/api/workouts/${workoutId}`);
  weId = detail.body.items[0].id;
});

describe("равноценные альтернативы", () => {
  it("связь создаётся симметрично (в обе стороны)", async () => {
    const res = await trainer
      .post(`/api/exercises/${squatId}/alternatives`)
      .send({ alternativeId: legPressId });
    expect(res.status).toBe(201);

    const forward = await trainer.get(`/api/exercises/${squatId}/alternatives`);
    expect(forward.body.alternatives.map((a: any) => a.id)).toContain(legPressId);

    const backward = await trainer.get(`/api/exercises/${legPressId}/alternatives`);
    expect(backward.body.alternatives.map((a: any) => a.id)).toContain(squatId);
  });

  it("упражнение не может заменять само себя", async () => {
    const res = await trainer
      .post(`/api/exercises/${squatId}/alternatives`)
      .send({ alternativeId: squatId });
    expect(res.status).toBe(400);
  });

  it("клиент видит доступные замены упражнения тренировки", async () => {
    const res = await client.get(`/api/workouts/${workoutId}/exercises/${weId}/alternatives`);
    expect(res.status).toBe(200);
    expect(res.body.alternatives.map((a: any) => a.id)).toEqual([legPressId]);
  });

  it("замена на упражнение вне списка альтернатив отклоняется", async () => {
    const res = await client
      .patch(`/api/workouts/${workoutId}/exercises/${weId}/replace`)
      .send({ alternativeId: benchId });
    expect(res.status).toBe(400);
  });

  it("клиент заменяет упражнение до записи подходов", async () => {
    const res = await client
      .patch(`/api/workouts/${workoutId}/exercises/${weId}/replace`)
      .send({ alternativeId: legPressId });
    expect(res.status).toBe(200);
    expect(res.body.workoutExercise.exerciseId).toBe(legPressId);
  });

  it("после записи подхода замена запрещена (409)", async () => {
    await client
      .post(`/api/workouts/${workoutId}/log`)
      .send({ workoutExerciseId: weId, setNumber: 1, weight: 100, reps: 10 });

    const res = await client
      .patch(`/api/workouts/${workoutId}/exercises/${weId}/replace`)
      .send({ alternativeId: squatId });
    expect(res.status).toBe(409);
  });

  it("удаление связи снимает её с обеих сторон", async () => {
    await trainer.delete(`/api/exercises/${squatId}/alternatives/${legPressId}`);
    const forward = await trainer.get(`/api/exercises/${squatId}/alternatives`);
    const backward = await trainer.get(`/api/exercises/${legPressId}/alternatives`);
    expect(forward.body.alternatives).toHaveLength(0);
    expect(backward.body.alternatives).toHaveLength(0);
  });
});

describe("группировка (суперсеты)", () => {
  it("groupKey и groupType сохраняются в тренировке", async () => {
    const detail = await client.get(`/api/workouts/${workoutId}`);
    expect(detail.body.items[0].groupKey).toBe("g1");
    expect(detail.body.items[0].groupType).toBe("superset");
  });

  it("группа переносится из шаблона в назначенную тренировку", async () => {
    const tpl = await trainer.post("/api/templates").send({
      name: "Суперсет-день",
      items: [
        { exerciseId: squatId, order: 0, sets: 3, reps: "10", groupKey: "s1", groupType: "superset" },
        { exerciseId: benchId, order: 1, sets: 3, reps: "10", groupKey: "s1", groupType: "superset" },
      ],
    });
    const templateId = tpl.body.template.id;

    const created = await trainer.post("/api/clients").send({ name: "Клиент шаблона" });
    const w = await trainer
      .post("/api/workouts")
      .send({ clientId: created.body.client.id, templateId });

    const detail = await trainer.get(`/api/workouts/${w.body.workout.id}`);
    expect(detail.body.items).toHaveLength(2);
    expect(detail.body.items.every((i: any) => i.groupKey === "s1")).toBe(true);
    expect(detail.body.items[0].groupType).toBe("superset");
  });
});
