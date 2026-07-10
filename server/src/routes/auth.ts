import { Router } from "express";
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import { clientInvites, clients, trainerSubscriptions, users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signToken, verifyToken, AUTH_COOKIE, cookieOptions } from "../auth/jwt.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { emailHtml, sendEmail } from "../services/email.js";
import { consumeEmailCode, createEmailCode, hourlyLimited } from "../services/emailCodes.js";
import { PLANS, TRIAL_DAYS } from "../services/plans.js";
import { notify } from "../services/notify.js";
import { env } from "../env.js";

export const authRouter = Router();

// Саморегистрация — только для тренеров. Клиенты попадают в кабинет
// исключительно по инвайту тренера (иначе аккаунт не привязан к карточке).
const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  name: z.string().min(1, "Укажите имя"),
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
        role: "trainer",
      })
      .returning();
    if (!user) throw new HttpError(500, "Не удалось создать пользователя");

    // Trial-подписка тренера (лимиты из PLANS, оплата подключится позже).
    const paidUntil = new Date(Date.now() + TRIAL_DAYS * 86400000)
      .toISOString()
      .slice(0, 10);
    await db.insert(trainerSubscriptions).values({
      trainerId: user.id,
      plan: "trial",
      status: "trial",
      paidUntil,
      clientLimit: PLANS.trial.clientLimit,
    });

    // Welcome + код подтверждения почты — не блокируем ответ.
    void (async () => {
      const code = await createEmailCode(user.email, "verify");
      await sendEmail({
        to: user.email,
        subject: "Добро пожаловать в FitPro",
        html: emailHtml({
          title: `Здравствуйте, ${user.name}!`,
          intro: `Аккаунт тренера создан, пробный период — ${TRIAL_DAYS} дней. Чтобы подтвердить почту, введите код в личном кабинете:`,
          code,
          ctaText: "Открыть FitPro",
          ctaUrl: env.publicUrl,
        }),
        text: `Добро пожаловать в FitPro! Код подтверждения почты: ${code}`,
      });
    })().catch((err) => console.error("register: welcome email:", err));

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

// Публичный: «кто я?» без сессии — это не ошибка, а ответ «никто».
// (401 здесь заставлял браузер писать красную ошибку в консоль на каждой загрузке.)
authRouter.get(
  "/me",
  asyncH(async (req, res) => {
    const token = req.cookies?.[AUTH_COOKIE];
    const u = token ? verifyToken(token) : null;
    if (!u) return res.json({ user: null });

    // emailVerified читаем из БД, а не из JWT — иначе флаг протухает до перелогина.
    const [row] = await db
      .select({ emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.id, u.sub));
    res.json({
      user: {
        id: u.sub,
        email: u.email,
        name: u.name,
        role: u.role,
        emailVerified: Boolean(row?.emailVerifiedAt),
      },
    });
  }),
);

/* ------------------------------------------------------------------ */
/* Подтверждение email и сброс пароля одноразовыми кодами              */
/* ------------------------------------------------------------------ */

authRouter.post(
  "/verify/request",
  requireAuth,
  asyncH(async (req, res) => {
    const email = req.user!.email;
    if (hourlyLimited(`verify:${email}`, 3)) {
      throw new HttpError(429, "Слишком много запросов кода. Попробуйте через час.");
    }
    const code = await createEmailCode(email, "verify");
    await sendEmail({
      to: email,
      subject: "Подтверждение почты — FitPro",
      html: emailHtml({
        title: "Подтвердите адрес почты",
        intro: "Введите этот код в личном кабинете FitPro:",
        code,
      }),
      text: `Код подтверждения почты FitPro: ${code} (действует 15 минут)`,
    });
    res.json({ ok: true });
  }),
);

authRouter.post(
  "/verify/confirm",
  requireAuth,
  asyncH(async (req, res) => {
    const { code } = z.object({ code: z.string().min(4).max(10) }).parse(req.body);
    const email = req.user!.email;
    const result = await consumeEmailCode(email, "verify", code);
    if (!result.ok) throw new HttpError(400, result.error ?? "Неверный код");
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, req.user!.sub));
    res.json({ ok: true });
  }),
);

authRouter.post(
  "/reset/request",
  asyncH(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const normalized = email.toLowerCase();
    // Ответ всегда ok — не раскрываем, существует ли аккаунт.
    if (!hourlyLimited(`reset:${normalized}`, 3) && !hourlyLimited(`reset-ip:${req.ip}`, 10)) {
      const [user] = await db.select().from(users).where(eq(users.email, normalized));
      if (user) {
        const code = await createEmailCode(normalized, "reset");
        await sendEmail({
          to: normalized,
          subject: "Сброс пароля — FitPro",
          html: emailHtml({
            title: "Сброс пароля",
            intro:
              "Вы запросили сброс пароля в FitPro. Введите этот код на странице восстановления:",
            code,
          }),
          text: `Код сброса пароля FitPro: ${code} (действует 15 минут)`,
        });
      }
    }
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ */
/* Инвайт клиента: публичная информация и принятие приглашения         */
/* ------------------------------------------------------------------ */

async function findActiveInvite(token: string) {
  const [invite] = await db
    .select()
    .from(clientInvites)
    .where(
      and(
        eq(clientInvites.token, token),
        isNull(clientInvites.acceptedAt),
        gt(clientInvites.expiresAt, new Date()),
      ),
    );
  return invite;
}

authRouter.get(
  "/invite/:token",
  asyncH(async (req, res) => {
    const invite = await findActiveInvite(req.params.token);
    if (!invite) throw new HttpError(404, "Приглашение не найдено или устарело");
    const [trainer] = await db.select().from(users).where(eq(users.id, invite.trainerId));
    const [card] = await db.select().from(clients).where(eq(clients.id, invite.clientId));
    if (!trainer || !card) throw new HttpError(404, "Приглашение не найдено или устарело");
    res.json({
      invite: {
        trainerName: trainer.name,
        clientName: card.name,
        email: invite.email,
      },
    });
  }),
);

authRouter.post(
  "/invite/:token/accept",
  asyncH(async (req, res) => {
    const data = z
      .object({
        email: z.string().email("Некорректный email"),
        password: z.string().min(6, "Пароль минимум 6 символов"),
      })
      .parse(req.body);
    const invite = await findActiveInvite(req.params.token);
    if (!invite) throw new HttpError(404, "Приглашение не найдено или устарело");

    const [card] = await db.select().from(clients).where(eq(clients.id, invite.clientId));
    if (!card) throw new HttpError(404, "Приглашение не найдено или устарело");
    if (card.userId) throw new HttpError(409, "К этой карточке уже привязан аккаунт");

    const normalized = data.email.toLowerCase();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized));
    if (existing.length > 0) {
      throw new HttpError(409, "Пользователь с таким email уже существует");
    }

    const passwordHash = await hashPassword(data.password);
    const [user] = await db
      .insert(users)
      .values({
        email: normalized,
        passwordHash,
        name: card.name,
        role: "client",
        // Пришёл по ссылке из письма на этот же адрес — почта фактически подтверждена.
        emailVerifiedAt:
          invite.email && invite.email.toLowerCase() === normalized ? new Date() : null,
      })
      .returning();
    if (!user) throw new HttpError(500, "Не удалось создать пользователя");

    await db.update(clients).set({ userId: user.id }).where(eq(clients.id, card.id));
    await db
      .update(clientInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(clientInvites.id, invite.id));
    await notify(
      invite.trainerId,
      `Клиент «${card.name}» принял приглашение и завёл кабинет`,
      `/t/clients/${card.id}`,
    );

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
  "/reset/confirm",
  asyncH(async (req, res) => {
    const data = z
      .object({
        email: z.string().email(),
        code: z.string().min(4).max(10),
        password: z.string().min(6, "Пароль минимум 6 символов"),
      })
      .parse(req.body);
    const normalized = data.email.toLowerCase();
    const result = await consumeEmailCode(normalized, "reset", data.code);
    if (!result.ok) throw new HttpError(400, result.error ?? "Неверный код");
    const [user] = await db.select().from(users).where(eq(users.email, normalized));
    if (!user) throw new HttpError(400, "Неверный код.");
    const passwordHash = await hashPassword(data.password);
    await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    res.json({ ok: true });
  }),
);
