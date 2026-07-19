import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("trainer: подписка", () => {
  it("отдаёт тариф, срок и использование лимита", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "sub-trainer@test.ru", password: "secret1", name: "СТ" });

    const res = await agent.get("/api/trainer/subscription");
    expect(res.status).toBe(200);
    expect(res.body.subscription.plan).toBe("trial");
    expect(res.body.subscription.planTitle).toBe("Пробный период");
    expect(res.body.subscription.clientLimit).toBe(10);
    // Демо-клиент лимита не занимает.
    expect(res.body.subscription.clientsUsed).toBe(0);
    expect(res.body.subscription.paidUntil).toBeTruthy();
  });

  it("недоступна клиенту (403)", async () => {
    const trainer = request.agent(app);
    await trainer
      .post("/api/auth/register")
      .send({ email: "sub-trainer2@test.ru", password: "secret1", name: "СТ2" });
    const created = await trainer.post("/api/clients").send({ name: "Клиент Подписки" });
    const invited = await trainer.post(`/api/clients/${created.body.client.id}/invite`).send({});
    const token = invited.body.link.split("/join/")[1];
    const accepted = await request(app)
      .post(`/api/auth/invite/${token}/accept`)
      .send({ email: "sub-client@test.ru", password: "secret1" });
    expect(accepted.status).toBe(201);

    const client = request.agent(app);
    await client
      .post("/api/auth/login")
      .send({ email: "sub-client@test.ru", password: "secret1" });
    const res = await client.get("/api/trainer/subscription");
    expect(res.status).toBe(403);
  });
});
