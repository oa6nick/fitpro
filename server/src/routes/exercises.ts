import { Router } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { exercises, exerciseAlternatives } from "../db/schema.js";
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

/* ------------------------------------------------------------------ */
/* Равноценные альтернативы (замены) упражнения                        */
/* ------------------------------------------------------------------ */

/** Убеждаемся, что упражнение принадлежит тренеру. */
async function assertOwnExercise(trainerId: string, exerciseId: string) {
  const [ex] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.trainerId, trainerId)));
  if (!ex) throw new HttpError(404, "Упражнение не найдено");
  return ex;
}

exercisesRouter.get(
  "/:id/alternatives",
  asyncH(async (req, res) => {
    await assertOwnExercise(req.user!.sub, req.params.id);
    const rows = await db
      .select({ link: exerciseAlternatives, ex: exercises })
      .from(exerciseAlternatives)
      .innerJoin(exercises, eq(exerciseAlternatives.alternativeId, exercises.id))
      .where(eq(exerciseAlternatives.exerciseId, req.params.id));
    res.json({ alternatives: rows.map((r) => ({ ...r.ex, linkId: r.link.id })) });
  }),
);

exercisesRouter.post(
  "/:id/alternatives",
  asyncH(async (req, res) => {
    const { alternativeId } = z.object({ alternativeId: z.string().uuid() }).parse(req.body);
    if (alternativeId === req.params.id) {
      throw new HttpError(400, "Упражнение не может заменять само себя");
    }
    await assertOwnExercise(req.user!.sub, req.params.id);
    await assertOwnExercise(req.user!.sub, alternativeId);

    const [existing] = await db
      .select()
      .from(exerciseAlternatives)
      .where(
        and(
          eq(exerciseAlternatives.exerciseId, req.params.id),
          eq(exerciseAlternatives.alternativeId, alternativeId),
        ),
      );
    if (existing) return res.json({ ok: true });

    // Связь равноценная — пишем в обе стороны, чтобы замена работала симметрично.
    await db.insert(exerciseAlternatives).values([
      { exerciseId: req.params.id, alternativeId },
      { exerciseId: alternativeId, alternativeId: req.params.id },
    ]);
    res.status(201).json({ ok: true });
  }),
);

exercisesRouter.delete(
  "/:id/alternatives/:altId",
  asyncH(async (req, res) => {
    await assertOwnExercise(req.user!.sub, req.params.id);
    await db
      .delete(exerciseAlternatives)
      .where(
        and(
          eq(exerciseAlternatives.exerciseId, req.params.id),
          eq(exerciseAlternatives.alternativeId, req.params.altId),
        ),
      );
    await db
      .delete(exerciseAlternatives)
      .where(
        and(
          eq(exerciseAlternatives.exerciseId, req.params.altId),
          eq(exerciseAlternatives.alternativeId, req.params.id),
        ),
      );
    res.json({ ok: true });
  }),
);
