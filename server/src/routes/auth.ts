import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signToken, AUTH_COOKIE, cookieOptions } from "../auth/jwt.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  name: z.string().min(1, "Укажите имя"),
  role: z.enum(["trainer", "client"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/register",
  asyncH(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()));
    if (existing.length > 0) {
      throw new HttpError(409, "Пользователь с таким email уже существует");
    }
    const passwordHash = await hashPassword(data.password);
    const [user] = await db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role,
      })
      .returning();
    if (!user) throw new HttpError(500, "Не удалось создать пользователя");

    const token = signToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);

authRouter.post(
  "/login",
  asyncH(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()));
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new HttpError(401, "Неверный email или пароль");
    }
    const token = signToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  }),
);

authRouter.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

authRouter.get(
  "/me",
  requireAuth,
  asyncH(async (req, res) => {
    const u = req.user!;
    res.json({ user: { id: u.sub, email: u.email, name: u.name, role: u.role } });
  }),
);
