import { Router } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";

export const exercisesRouter = Router();
exercisesRouter.use(requireAuth, requireRole("trainer"));

const schema = z.object({
  name: z.string().min(1),
  videoUrl: z.string().optional(),
  techniqueDescription: z.string().optional(),
  keyHints: z.string().optional(),
  commonMistakes: z.string().optional(),
  muscles: z.string().optional(),
  easierVariant: z.string().optional(),
  harderVariant: z.string().optional(),
});

exercisesRouter.get(
  "/",
  asyncH(async (req, res) => {
    const rows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.trainerId, req.user!.sub))
      .orderBy(desc(exercises.createdAt));
    res.json({ exercises: rows });
  }),
);

exercisesRouter.post(
  "/",
  asyncH(async (req, res) => {
    const data = schema.parse(req.body);
    const [created] = await db
      .insert(exercises)
      .values({ ...data, trainerId: req.user!.sub })
      .returning();
    res.status(201).json({ exercise: created });
  }),
);

exercisesRouter.patch(
  "/:id",
  asyncH(async (req, res) => {
    const data = schema.partial().parse(req.body);
    const [updated] = await db
      .update(exercises)
      .set(data)
      .where(and(eq(exercises.id, req.params.id), eq(exercises.trainerId, req.user!.sub)))
      .returning();
    if (!updated) throw new HttpError(404, "Упражнение не найдено");
    res.json({ exercise: updated });
  }),
);

exercisesRouter.delete(
  "/:id",
  asyncH(async (req, res) => {
    await db
      .delete(exercises)
      .where(and(eq(exercises.id, req.params.id), eq(exercises.trainerId, req.user!.sub)));
    res.json({ ok: true });
  }),
);
