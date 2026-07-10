import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

async function registerTrainer(email: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/auth/register")
    .send({ email, password: "secret1", name: "Тренер Инвайтов" });
  return agent;
}

describe("инвайты клиентов", () => {
  it("полный флоу: карточка → инвайт → accept → клиент видит свой кабинет", async () => {
    const trainer = await registerTrainer("inv-t1@test.ru");

    const created = await trainer.post("/api/clients").send({ name: "Мария Клиентова" });
    expect(created.status).toBe(201);
    const clientId = created.body.client.id;

    const invited = await trainer.post(`/api/clients/${clientId}/invite`).send({});
    expect(invited.status).toBe(201);
    const token = invited.body.link.split("/join/")[1];
    expect(token).toBeTruthy();

    // Публичная информация об инвайте.
    const info = await request(app).get(`/api/auth/invite/${token}`);
    expect(info.status).toBe(200);
    expect(info.body.invite.clientName).toBe("Мария Клиентова");

    // Принятие: создаётся user role=client, привязка к карточке, логин.
    const clientAgent = request.agent(app);
    const accept = await clientAgent
      .post(`/api/auth/invite/${token}/accept`)
      .send({ email: "maria@test.ru", password: "secret1" });
    expect(accept.status).toBe(201);
    expect(accept.body.user.role).toBe("client");

    // resolveClientForUser теперь работает: /me/home отдаёт кабинет клиента.
    const me = await clientAgent.get("/api/auth/me");
    expect(me.body.user.role).toBe("client");

    // Повторное использование инвайта — отказ.
    const again = await request(app)
      .post(`/api/auth/invite/${token}/accept`)
      .send({ email: "other@test.ru", password: "secret1" });
    expect(again.status).toBe(404);
  });

  it("инвайт для карточки с уже привязанным аккаунтом — отказ", async () => {
    const trainer = await registerTrainer("inv-t2@test.ru");
    const created = await trainer.post("/api/clients").send({ name: "Пётр" });
    const clientId = created.body.client.id;

    const inv1 = await trainer.post(`/api/clients/${clientId}/invite`).send({});
    const token = inv1.body.link.split("/join/")[1];
    await request(app)
      .post(`/api/auth/invite/${token}/accept`)
      .send({ email: "petr@test.ru", password: "secret1" });

    const inv2 = await trainer.post(`/api/clients/${clientId}/invite`).send({});
    expect(inv2.status).toBe(409);
  });

  it("несуществующий токен → 404", async () => {
    const res = await request(app).get("/api/auth/invite/deadbeef");
    expect(res.status).toBe(404);
  });

  it("лимит тарифа: 11-й клиент на trial отклоняется с 402", async () => {
    const trainer = await registerTrainer("inv-t3@test.ru");
    for (let i = 1; i <= 10; i++) {
      const r = await trainer.post("/api/clients").send({ name: `Клиент ${i}` });
      expect(r.status).toBe(201);
    }
    const over = await trainer.post("/api/clients").send({ name: "Одиннадцатый" });
    expect(over.status).toBe(402);
  });
});
