import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH } from "../lib/http.js";
import { assertTrainerClient, resolveClientForUser } from "../services/access.js";
import { buildClientAnalytics } from "../services/clientAnalytics.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

// Клиент: своя аналитика (тоннаж, 1ПМ, PR) — паритет с кабинетом тренера.
analyticsRouter.get(
  "/mine",
  requireRole("client"),
  asyncH(async (req, res) => {
    const client = await resolveClientForUser(req.user!.sub);
    const data = await buildClientAnalytics(client.id, client.streakWeeks ?? 0);
    res.json(data);
  }),
);

// Тренер: аналитика по клиенту.
analyticsRouter.get(
  "/client/:id",
  requireRole("trainer"),
  asyncH(async (req, res) => {
    const clientId = z.string().uuid().parse(req.params.id);
    await assertTrainerClient(req.user!.sub, clientId);
    const [c] = await db
      .select({ streakWeeks: clients.streakWeeks })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    const data = await buildClientAnalytics(clientId, c?.streakWeeks ?? 0);
    res.json(data);
  }),
);
