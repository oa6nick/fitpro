import { describe, expect, it } from "vitest";
import request from "supertest";
import { eq } from "drizzle-orm";
import { createApp } from "../app.js";
import { db } from "../db/client.js";
import { authEmailCodes, trainerSubscriptions, users } from "../db/schema.js";

const app = createApp();

/** Достаём код не из письма (EMAIL_PROVIDER=off), а «пересоздав» запись напрямую нельзя —
 * код хэширован. Поэтому в тестах перезаписываем хэш известного кода. */
async function forceCode(email: string, purpose: "verify" | "reset", code: string) {
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256").update(code).digest("hex");
  await db.insert(authEmailCodes).values({
    email,
    purpose,
    codeHash: hash,
    expiresAt: new Date(Date.now() + 15 * 60_000),
  });
}

describe("auth: регистрация тренера", () => {
  it("register создаёт тренера с trial-подпиской и логинит", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new-trainer@test.ru", password: "secret1", name: "Новый Тренер" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("trainer");
    expect(res.headers["set-cookie"]?.[0]).toMatch(/token/i);

    const [sub] = await db
      .select()
      .from(trainerSubscriptions)
      .where(eq(trainerSubscriptions.trainerId, res.body.user.id));
    expect(sub?.status).toBe("trial");
    expect(sub?.clientLimit).toBe(10);
  });

  it("register игнорирует попытку передать роль client", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "sneaky@test.ru", password: "secret1", name: "Хитрец", role: "client" });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("trainer");
  });

  it("me без сессии отдаёт 200 и user=null (а не 401)", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it("me отдаёт emailVerified=false для нового аккаунта", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "t2@test.ru", password: "secret1", name: "Т2" });
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.emailVerified).toBe(false);
  });
});

describe("auth: verify и reset", () => {
  it("verify/confirm проставляет emailVerifiedAt", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ email: "v1@test.ru", password: "secret1", name: "В1" });
    await forceCode("v1@test.ru", "verify", "123456");

    const confirm = await agent.post("/api/auth/verify/confirm").send({ code: "123456" });
    expect(confirm.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.body.user.emailVerified).toBe(true);
  });

  it("reset: request всегда ok, confirm меняет пароль", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "r1@test.ru", password: "oldpass", name: "Р1" });

    const req1 = await request(app)
      .post("/api/auth/reset/request")
      .send({ email: "r1@test.ru" });
    expect(req1.status).toBe(200);
    expect(req1.body.ok).toBe(true);

    // Несуществующий email — тоже ok (не раскрываем).
    const req2 = await request(app)
      .post("/api/auth/reset/request")
      .send({ email: "ghost@test.ru" });
    expect(req2.body.ok).toBe(true);

    await forceCode("r1@test.ru", "reset", "654321");
    const confirm = await request(app)
      .post("/api/auth/reset/confirm")
      .send({ email: "r1@test.ru", code: "654321", password: "newpass1" });
    expect(confirm.status).toBe(200);

    const badLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "r1@test.ru", password: "oldpass" });
    expect(badLogin.status).toBe(401);

    const goodLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "r1@test.ru", password: "newpass1" });
    expect(goodLogin.status).toBe(200);
  });

  it("reset/confirm с неверным кодом отклоняется", async () => {
    await db.delete(users).where(eq(users.email, "r2@test.ru"));
    await request(app)
      .post("/api/auth/register")
      .send({ email: "r2@test.ru", password: "oldpass", name: "Р2" });
    const res = await request(app)
      .post("/api/auth/reset/confirm")
      .send({ email: "r2@test.ru", code: "000000", password: "newpass1" });
    expect(res.status).toBe(400);
  });
});
