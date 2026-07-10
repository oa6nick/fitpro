import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients, clientProfiles, achievements, payments } from "../db/schema.js";
import { desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { resolveClientForUser, touchClientActivity } from "../services/access.js";
import { asyncH } from "../lib/http.js";
import { z } from "zod";

// Эндпоинты «про себя» для роли client (кабинет).
export const meRouter = Router();
meRouter.use(requireAuth, requireRole("client"));

meRouter.get(
  "/client",
  asyncH(async (req, res) => {
    const client = await resolveClientForUser(req.user!.sub);
    const [profile] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.clientId, client.id));
    const badges = await db
      .select()
      .from(achievements)
      .where(eq(achievements.clientId, client.id))
      .orderBy(desc(achievements.earnedAt));

    // Последняя оплата — чтобы показать «Оплачено до …» и предупредить о продлении.
    const [lastPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, client.id))
      .orderBy(desc(payments.date))
      .limit(1);

    res.json({
      client,
      profile: profile ?? null,
      achievements: badges,
      payment: lastPayment
        ? {
            paidUntil: lastPayment.periodEnd ?? lastPayment.nextRenewalDate,
            status: lastPayment.status,
            amount: lastPayment.amount,
          }
        : null,
    });
  }),
);

const profileSchema = z.object({
  trainingExperience: z.string().optional(),
  injuries: z.string().optional(),
  lifestyle: z.string().optional(),
  nutrition: z.string().optional(),
  steps: z.number().int().optional(),
  equipment: z.string().optional(),
  preferences: z.string().optional(),
  dislikes: z.string().optional(),
});

// Клиент заполняет/обновляет анкету -> статус воронки переходит в profile_filled.
meRouter.put(
  "/profile",
  asyncH(async (req, res) => {
    const client = await resolveClientForUser(req.user!.sub);
    const data = profileSchema.parse(req.body);
    const [existing] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.clientId, client.id));

    let profile;
    if (existing) {
      [profile] = await db
        .update(clientProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clientProfiles.clientId, client.id))
        .returning();
    } else {
      [profile] = await db
        .insert(clientProfiles)
        .values({ clientId: client.id, ...data })
        .returning();
    }

    // Воронка: new -> profile_filled после первого заполнения анкеты.
    if (client.funnelStatus === "new") {
      await db
        .update(clients)
        .set({ funnelStatus: "profile_filled" })
        .where(eq(clients.id, client.id));
    }
    await touchClientActivity(client.id);
    res.json({ profile });
  }),
);
