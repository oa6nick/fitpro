import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("billing: оплата подписки", () => {
  it("plans отдаёт платные тарифы с ценами и флагом enabled", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "bill-trainer@test.ru", password: "secret1", name: "Б1" });

    const res = await agent.get("/api/billing/plans");
    expect(res.status).toBe(200);
    // В тестах ключи ЮKassa не заданы.
    expect(res.body.enabled).toBe(false);
    expect(res.body.plans).toHaveLength(3);
    expect(res.body.plans[0]).toMatchObject({ id: "basic", priceRub: 990, clientLimit: 10 });
  });

  it("subscribe без ключей ЮKassa отвечает 503 с человеческим текстом", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "bill-trainer2@test.ru", password: "secret1", name: "Б2" });

    const res = await agent.post("/api/billing/subscribe").send({ plan: "pro" });
    expect(res.status).toBe(503);
    expect(res.body.error).toContain("Оплата подключается");
  });

  it("вебхук без ключей отвечает 200 (нечего проверять)", async () => {
    const res = await request(app)
      .post("/api/billing/webhook")
      .send({ event: "payment.succeeded", object: { id: "fake-id" } });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("вебхук с нестроковым object.id не падает (200, а не 500)", async () => {
    const res = await request(app)
      .post("/api/billing/webhook")
      .send({ object: { id: { $ne: null } } });
    expect(res.status).toBe(200);
  });
});
