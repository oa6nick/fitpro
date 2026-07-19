import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { paymentIntents, trainerSubscriptions } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { PLANS, type PlanId } from "../services/plans.js";
import { createPayment, getPayment } from "../services/yookassa.js";
import { env } from "../env.js";

/**
 * Оплата подписки тренера через ЮKassa.
 * Флоу: subscribe → confirmationUrl (страница оплаты ЮKassa) → пользователь платит →
 * вебхук → re-fetch платежа из API (никогда не верим телу вебхука) → активация тарифа.
 */
export const billingRouter = Router();

const PAYABLE: PlanId[] = ["basic", "pro", "expert"];

// Тарифы публичны для авторизованных обеих ролей не нужны — только тренеру.
billingRouter.get(
  "/plans",
  requireAuth,
  requireRole("trainer"),
  (_req, res) => {
    res.json({
      enabled: env.billingEnabled,
      plans: PAYABLE.map((id) => ({
        id,
        title: PLANS[id].title,
        priceRub: PLANS[id].priceRub,
        clientLimit: PLANS[id].clientLimit,
      })),
    });
  },
);

billingRouter.post(
  "/subscribe",
  requireAuth,
  requireRole("trainer"),
  asyncH(async (req, res) => {
    if (!env.billingEnabled) {
      throw new HttpError(503, "Оплата подключается. Пока напишите нам — активируем вручную.");
    }
    const { plan } = z.object({ plan: z.enum(["basic", "pro", "expert"]) }).parse(req.body);
    const info = PLANS[plan];

    const payment = await createPayment({
      amountRub: info.priceRub,
      description: `FitPro, тариф «${info.title}», 30 дней`,
      returnUrl: `${env.publicUrl}/t?payment=done`,
      metadata: { trainerId: req.user!.sub, plan },
    });

    await db.insert(paymentIntents).values({
      trainerId: req.user!.sub,
      plan,
      amountRub: info.priceRub,
      providerPaymentId: payment.id,
    });

    const url = payment.confirmation?.confirmation_url;
    if (!url) throw new HttpError(502, "ЮKassa не вернула страницу оплаты");
    res.status(201).json({ confirmationUrl: url, paymentId: payment.id });
  }),
);

/** Вебхук ЮKassa — публичный; идемпотентен по payment_intents.status. */
billingRouter.post(
  "/webhook",
  asyncH(async (req, res) => {
    // Без ключей просто подтверждаем приём (нечего проверять).
    if (!env.billingEnabled) return res.json({ ok: true });

    const paymentId = (req.body?.object?.id ?? "") as string;
    if (!paymentId) return res.json({ ok: true });

    const [intent] = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.providerPaymentId, paymentId));
    if (!intent || intent.status === "succeeded") return res.json({ ok: true });

    // Единственный источник истины — сам API ЮKassa.
    const payment = await getPayment(paymentId);
    if (!payment) return res.json({ ok: true });

    if (payment.status === "canceled") {
      await db
        .update(paymentIntents)
        .set({ status: "canceled", completedAt: new Date() })
        .where(eq(paymentIntents.id, intent.id));
      return res.json({ ok: true });
    }
    if (payment.status !== "succeeded") return res.json({ ok: true });

    const plan = intent.plan as PlanId;
    const info = PLANS[plan];
    const paidUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const [existing] = await db
      .select()
      .from(trainerSubscriptions)
      .where(eq(trainerSubscriptions.trainerId, intent.trainerId));
    if (existing) {
      await db
        .update(trainerSubscriptions)
        .set({
          plan,
          status: "active",
          paidUntil,
          clientLimit: info.clientLimit,
          updatedAt: new Date(),
        })
        .where(eq(trainerSubscriptions.id, existing.id));
    } else {
      await db.insert(trainerSubscriptions).values({
        trainerId: intent.trainerId,
        plan,
        status: "active",
        paidUntil,
        clientLimit: info.clientLimit,
      });
    }
    await db
      .update(paymentIntents)
      .set({ status: "succeeded", completedAt: new Date() })
      .where(eq(paymentIntents.id, intent.id));

    res.json({ ok: true });
  }),
);
