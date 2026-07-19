import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients, trainerSubscriptions } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH } from "../lib/http.js";
import { PLANS, type PlanId } from "../services/plans.js";

/**
 * Профиль тренера. Раньше подписка нигде наружу не отдавалась (только 402
 * при превышении лимита в POST /clients) — мобильному профилю нужен явный эндпоинт.
 */
export const trainerRouter = Router();
trainerRouter.use(requireAuth, requireRole("trainer"));

trainerRouter.get(
  "/subscription",
  asyncH(async (req, res) => {
    const trainerId = req.user!.sub;
    const [sub] = await db
      .select()
      .from(trainerSubscriptions)
      .where(eq(trainerSubscriptions.trainerId, trainerId));
    const used = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.trainerId, trainerId), eq(clients.isDemo, false)));

    if (!sub) {
      // Старые/seed-аккаунты без записи подписки: лимита нет.
      return res.json({ subscription: null, clientsUsed: used.length });
    }
    const plan = PLANS[sub.plan as PlanId];
    res.json({
      subscription: {
        plan: sub.plan,
        planTitle: plan?.title ?? sub.plan,
        status: sub.status,
        paidUntil: sub.paidUntil,
        clientLimit: sub.clientLimit,
        clientsUsed: used.length,
      },
    });
  }),
);
