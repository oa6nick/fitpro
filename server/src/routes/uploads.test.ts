import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

describe("uploads: файловый гейт", () => {
  it("без токена доступ к /uploads запрещён (401)", async () => {
    const res = await request(app).get("/uploads/whatever.png");
    expect(res.status).toBe(401);
  });

  it("с валидным токеном гейт пропускает (404 на несуществующий файл, не 401)", async () => {
    const agent = request.agent(app);
    const reg = await agent
      .post("/api/auth/login")
      .send({ email: "up@test.ru", password: "secret1", mobile: true });
    // регистрируем, если нет
    if (reg.status !== 200) {
      await agent
        .post("/api/auth/register")
        .send({ email: "up@test.ru", password: "secret1", name: "U" });
    }
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "up@test.ru", password: "secret1", mobile: true });
    const token = login.body.token as string;

    // через ?token=
    const viaQuery = await request(app).get(`/uploads/none-${Date.now()}.png?token=${token}`);
    expect(viaQuery.status).toBe(404);

    // через Bearer
    const viaBearer = await request(app)
      .get(`/uploads/none2-${Date.now()}.png`)
      .set("Authorization", `Bearer ${token}`);
    expect(viaBearer.status).toBe(404);
  });

  it("мусорный токен отклоняется (401)", async () => {
    const res = await request(app).get("/uploads/x.png?token=not-a-jwt");
    expect(res.status).toBe(401);
  });
});
