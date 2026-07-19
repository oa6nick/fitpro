import { describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { deviceTokens, pushSubscriptions } from "../db/schema.js";

const app = createApp();

const subscription = (endpoint: string) => ({
  endpoint,
  keys: { p256dh: "test-p256dh-key", auth: "test-auth-key" },
});

describe("push-подписки", () => {
  it("vapid-public-key доступен без авторизации и сообщает, включён ли push", async () => {
    const res = await request(app).get("/api/push/vapid-public-key");
    expect(res.status).toBe(200);
    // В тестах VAPID-ключи не заданы → push выключен, но эндпоинт отвечает.
    expect(res.body.enabled).toBe(false);
    expect(res.body.key).toBeNull();
  });

  it("subscribe требует авторизации", async () => {
    const res = await request(app)
      .post("/api/push/subscribe")
      .send(subscription("https://updates.push.services.mozilla.com/wpush/v2/a"));
    expect(res.status).toBe(401);
  });

  it("subscribe создаёт подписку, повторный вызов не плодит дубли", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "push-user@test.ru", password: "secret1", name: "Пушер" });

    const endpoint = "https://updates.push.services.mozilla.com/wpush/v2/u1";
    const first = await agent.post("/api/push/subscribe").send(subscription(endpoint));
    expect(first.status).toBe(201);

    const second = await agent.post("/api/push/subscribe").send(subscription(endpoint));
    expect(second.status).toBe(200);
    expect(second.body.updated).toBe(true);

    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    expect(rows).toHaveLength(1);
  });

  it("unsubscribe удаляет подписку", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "push-user2@test.ru", password: "secret1", name: "Пушер2" });

    const endpoint = "https://updates.push.services.mozilla.com/wpush/v2/u2";
    await agent.post("/api/push/subscribe").send(subscription(endpoint));
    const res = await agent.post("/api/push/unsubscribe").send({ endpoint });
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    expect(rows).toHaveLength(0);
  });

  it("device: регистрация нативного токена, перепривязка и удаление", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "push-device@test.ru", password: "secret1", name: "Д1" });

    const created = await agent
      .post("/api/push/device")
      .send({ platform: "android", token: "fcm-token-1234567890" });
    expect(created.status).toBe(201);

    // То же устройство перелогинилось под другим юзером — токен перепривязывается.
    const agent2 = request.agent(app);
    const reg2 = await agent2
      .post("/api/auth/register")
      .send({ email: "push-device2@test.ru", password: "secret1", name: "Д2" });
    const rebound = await agent2
      .post("/api/push/device")
      .send({ platform: "android", token: "fcm-token-1234567890" });
    expect(rebound.status).toBe(200);
    expect(rebound.body.updated).toBe(true);

    const rows = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, "fcm-token-1234567890"));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.userId).toBe(reg2.body.user.id);

    const removed = await agent2
      .delete("/api/push/device")
      .send({ token: "fcm-token-1234567890" });
    expect(removed.status).toBe(200);
    const after = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, "fcm-token-1234567890"));
    expect(after).toHaveLength(0);
  });

  it("subscribe отклоняет SSRF-endpoint (внутренний адрес)", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "ssrf@test.ru", password: "secret1", name: "SSRF" });
    const res = await agent.post("/api/push/subscribe").send({
      endpoint: "https://127.0.0.1:8080/internal",
      keys: { p256dh: "k", auth: "a" },
    });
    expect(res.status).toBe(400);
  });

  it("subscribe принимает валидный push-endpoint", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "ssrf-ok@test.ru", password: "secret1", name: "OK" });
    const res = await agent.post("/api/push/subscribe").send({
      endpoint: "https://updates.push.services.mozilla.com/wpush/v2/abc",
      keys: { p256dh: "k", auth: "a" },
    });
    expect(res.status).toBe(201);
  });

  it("device отклоняет неизвестную платформу", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "push-device3@test.ru", password: "secret1", name: "Д3" });
    const res = await agent
      .post("/api/push/device")
      .send({ platform: "web", token: "fcm-token-0987654321" });
    expect(res.status).toBe(400);
  });

  it("notify() не падает, когда push выключен (нет VAPID-ключей)", async () => {
    const { notify } = await import("../services/notify.js");
    const agent = request.agent(app);
    const reg = await agent
      .post("/api/auth/register")
      .send({ email: "push-notify@test.ru", password: "secret1", name: "Н" });

    await expect(notify(reg.body.user.id, "Тестовое уведомление", "/t")).resolves.toBeUndefined();
  });
});
