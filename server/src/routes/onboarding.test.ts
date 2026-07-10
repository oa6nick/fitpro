import { describe, expect, it } from "vitest";
import request from "supertest";
import { and, eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { clients, workouts } from "../db/schema.js";

const app = createApp();

describe("тестовый клиент при регистрации тренера", () => {
  it("создаётся демо-клиент с пробной тренировкой", async () => {
    const agent = request.agent(app);
    const reg = await agent
      .post("/api/auth/register")
      .send({ email: "demo-trainer@test.ru", password: "secret1", name: "Новичок" });
    const trainerId = reg.body.user.id;

    const list = await agent.get("/api/clients");
    expect(list.body.clients).toHaveLength(1);
    const demo = list.body.clients[0];
    expect(demo.isDemo).toBe(true);
    expect(demo.name).toBe("Тестовый клиент");

    const [row] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.trainerId, trainerId), eq(clients.isDemo, true)));
    const demoWorkouts = await db
      .select()
      .from(workouts)
      .where(eq(workouts.clientId, row!.id));
    expect(demoWorkouts).toHaveLength(1);
  });

  it("демо-клиент не занимает место в лимите тарифа", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "limit-trainer@test.ru", password: "secret1", name: "Лимит" });

    // trial: лимит 10. Демо уже есть, значит должно влезть ровно 10 реальных.
    for (let i = 1; i <= 10; i++) {
      const r = await agent.post("/api/clients").send({ name: `Клиент ${i}` });
      expect(r.status).toBe(201);
    }
    const over = await agent.post("/api/clients").send({ name: "Одиннадцатый" });
    expect(over.status).toBe(402);
  });

  it("удаление клиента уносит его тренировки (каскад)", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "del-trainer@test.ru", password: "secret1", name: "Удалятель" });

    const list = await agent.get("/api/clients");
    const demoId = list.body.clients[0].id;

    const before = await db.select().from(workouts).where(eq(workouts.clientId, demoId));
    expect(before.length).toBeGreaterThan(0);

    const del = await agent.delete(`/api/clients/${demoId}`);
    expect(del.status).toBe(200);

    const after = await db.select().from(workouts).where(eq(workouts.clientId, demoId));
    expect(after).toHaveLength(0);
  });
});

describe("оплаченный период клиента", () => {
  it("me/client отдаёт «оплачено до» из periodEnd", async () => {
    const trainer = request.agent(app);
    await trainer
      .post("/api/auth/register")
      .send({ email: "pay-trainer@test.ru", password: "secret1", name: "Финансист" });

    const created = await trainer.post("/api/clients").send({ name: "Плательщик" });
    const clientId = created.body.client.id;

    // Привязываем аккаунт клиента через инвайт.
    const inv = await trainer.post(`/api/clients/${clientId}/invite`).send({});
    const token = inv.body.link.split("/join/")[1];
    const clientAgent = request.agent(app);
    await clientAgent
      .post(`/api/auth/invite/${token}/accept`)
      .send({ email: "payer@test.ru", password: "secret1" });

    await trainer.post("/api/finance").send({
      clientId,
      amount: 5000,
      date: "2026-07-01",
      periodStart: "2026-07-01",
      periodEnd: "2026-08-01",
    });

    const me = await clientAgent.get("/api/me/client");
    expect(me.status).toBe(200);
    expect(me.body.payment.paidUntil).toBe("2026-08-01");
    expect(me.body.payment.status).toBe("paid");
  });
});
