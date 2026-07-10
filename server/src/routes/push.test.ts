import { describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { pushSubscriptions } from "../db/schema.js";

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
      .send(subscription("https://push.example.com/a"));
    expect(res.status).toBe(401);
  });

  it("subscribe создаёт подписку, повторный вызов не плодит дубли", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "push-user@test.ru", password: "secret1", name: "Пушер" });

    const endpoint = "https://push.example.com/unique-1";
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

    const endpoint = "https://push.example.com/unique-2";
    await agent.post("/api/push/subscribe").send(subscription(endpoint));
    const res = await agent.post("/api/push/unsubscribe").send({ endpoint });
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    expect(rows).toHaveLength(0);
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
