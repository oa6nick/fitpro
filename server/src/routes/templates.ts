import { Router } from "express";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workoutTemplates, templateExercises } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";

export const templatesRouter = Router();
templatesRouter.use(requireAuth, requireRole("trainer"));

const itemSchema = z.object({
  exerciseId: z.string().uuid(),
  order: z.number().int().optional(),
  sets: z.number().int().optional(),
  reps: z.string().optional(),
  weight: z.string().optional(),
  tempo: z.string().optional(),
  rest: z.string().optional(),
  comment: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  items: z.array(itemSchema).default([]),
});

async function assertOwn(trainerId: string, templateId: string) {
  const [t] = await db
    .select()
    .from(workoutTemplates)
    .where(and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.trainerId, trainerId)));
  if (!t) throw new HttpError(404, "Шаблон не найден");
  return t;
}

templatesRouter.get(
  "/",
  asyncH(async (req, res) => {
    const rows = await db
      .select()
      .from(workoutTemplates)
      .where(eq(workoutTemplates.trainerId, req.user!.sub))
      .orderBy(desc(workoutTemplates.createdAt));
    res.json({ templates: rows });
  }),
);

templatesRouter.get(
  "/:id",
  asyncH(async (req, res) => {
    const template = await assertOwn(req.user!.sub, req.params.id);
    const items = await db
      .select()
      .from(templateExercises)
      .where(eq(templateExercises.templateId, template.id))
      .orderBy(asc(templateExercises.order));
    res.json({ template, items });
  }),
);

templatesRouter.post(
  "/",
  asyncH(async (req, res) => {
    const data = createSchema.parse(req.body);
    const [template] = await db
      .insert(workoutTemplates)
      .values({ name: data.name, goal: data.goal, trainerId: req.user!.sub })
      .returning();
    if (data.items.length) {
      await db.insert(templateExercises).values(
        data.items.map((it, i) => ({ ...it, order: it.order ?? i, templateId: template!.id })),
      );
    }
    res.status(201).json({ template });
  }),
);

templatesRouter.put(
  "/:id",
  asyncH(async (req, res) => {
    const template = await assertOwn(req.user!.sub, req.params.id!);
    const data = createSchema.parse(req.body);
    await db
      .update(workoutTemplates)
      .set({ name: data.name, goal: data.goal })
      .where(eq(workoutTemplates.id, template.id));
    // Полная замена строк шаблона.
    await db.delete(templateExercises).where(eq(templateExercises.templateId, template.id));
    if (data.items.length) {
      await db.insert(templateExercises).values(
        data.items.map((it, i) => ({ ...it, order: it.order ?? i, templateId: template.id })),
      );
    }
    res.json({ ok: true });
  }),
);

templatesRouter.delete(
  "/:id",
  asyncH(async (req, res) => {
    await assertOwn(req.user!.sub, req.params.id!);
    await db.delete(workoutTemplates).where(eq(workoutTemplates.id, req.params.id!));
    res.json({ ok: true });
  }),
);
