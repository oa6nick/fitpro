import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { measurements } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { assertTrainerClient, resolveClientForUser, touchClientActivity } from "../services/access.js";
import { recomputeAchievements } from "../services/gamification.js";

export const measurementsRouter = Router();
measurementsRouter.use(requireAuth);

const schema = z.object({
  date: z.string(),
  weight: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  chest: z.number().optional(),
  keyLifts: z.record(z.number()).optional(),
  photoBeforeUrl: z.string().optional(),
  photoAfterUrl: z.string().optional(),
});

// Список замеров клиента (тренер по clientId, либо клиент — свои).
measurementsRouter.get(
  "/",
  asyncH(async (req, res) => {
    let clientId: string;
    if (req.user!.role === "trainer") {
      clientId = z.string().uuid().parse(req.query.clientId);
      await assertTrainerClient(req.user!.sub, clientId);
    } else {
      const client = await resolveClientForUser(req.user!.sub);
      clientId = client.id;
    }
    const rows = await db
      .select()
      .from(measurements)
      .where(eq(measurements.clientId, clientId))
      .orderBy(desc(measurements.date));
    res.json({ measurements: rows });
  }),
);

// Добавить замер (клиент — себе; тренер — указанному клиенту).
measurementsRouter.post(
  "/",
  asyncH(async (req, res) => {
    const data = schema.parse(req.body);
    let clientId: string;
    if (req.user!.role === "trainer") {
      clientId = z.string().uuid().parse(req.body.clientId);
      await assertTrainerClient(req.user!.sub, clientId);
    } else {
      const client = await resolveClientForUser(req.user!.sub);
      clientId = client.id;
    }
    const [created] = await db
      .insert(measurements)
      .values({ ...data, clientId })
      .returning();
    if (req.user!.role === "client") await touchClientActivity(clientId);
    await recomputeAchievements(clientId);
    res.status(201).json({ measurement: created });
  }),
);

measurementsRouter.delete(
  "/:id",
  asyncH(async (req, res) => {
    const [m] = await db.select().from(measurements).where(eq(measurements.id, req.params.id));
    if (!m) throw new HttpError(404, "Замер не найден");
    if (req.user!.role === "trainer") {
      await assertTrainerClient(req.user!.sub, m.clientId);
    } else {
      const client = await resolveClientForUser(req.user!.sub);
      if (client.id !== m.clientId) throw new HttpError(403, "Недостаточно прав");
    }
    await db.delete(measurements).where(eq(measurements.id, req.params.id));
    res.json({ ok: true });
  }),
);
