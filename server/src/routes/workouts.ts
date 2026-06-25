import { Router } from "express";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  workouts,
  workoutExercises,
  workoutLogs,
  templateExercises,
  clients,
  exercises,
} from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { assertTrainerClient, resolveClientForUser, touchClientActivity } from "../services/access.js";
import { notify } from "../services/notify.js";
import { recomputeAchievements } from "../services/gamification.js";

export const workoutsRouter = Router();
workoutsRouter.use(requireAuth);

const exerciseRowSchema = z.object({
  exerciseId: z.string().uuid(),
  order: z.number().int().optional(),
  sets: z.number().int().optional(),
  reps: z.string().optional(),
  weight: z.string().optional(),
  tempo: z.string().optional(),
  rest: z.string().optional(),
  comment: z.string().optional(),
});

const assignSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().optional(),
  date: z.string().optional(),
  templateId: z.string().uuid().optional(),
  exercises: z.array(exerciseRowSchema).optional(),
});

/** Загружает тренировку и проверяет доступ по роли. */
async function loadAuthorized(req: any) {
  const [w] = await db.select().from(workouts).where(eq(workouts.id, req.params.id));
  if (!w) throw new HttpError(404, "Тренировка не найдена");
  const [client] = await db.select().from(clients).where(eq(clients.id, w.clientId));
  if (!client) throw new HttpError(404, "Клиент не найден");
  if (req.user.role === "trainer") {
    if (client.trainerId !== req.user.sub) throw new HttpError(403, "Недостаточно прав");
  } else {
    if (client.userId !== req.user.sub) throw new HttpError(403, "Недостаточно прав");
  }
  return { workout: w, client };
}

// Тренер: назначить тренировку клиенту (из шаблона или вручную).
workoutsRouter.post(
  "/",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const data = assignSchema.parse(req.body);
    await assertTrainerClient(req.user!.sub, data.clientId);

    let rows = data.exercises ?? [];
    // Если задан шаблон и строки не переданы — копируем из шаблона.
    if (data.templateId && rows.length === 0) {
      const tplRows = await db
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.templateId, data.templateId))
        .orderBy(asc(templateExercises.order));
      rows = tplRows.map((r) => ({
        exerciseId: r.exerciseId,
        order: r.order,
        sets: r.sets ?? undefined,
        reps: r.reps ?? undefined,
        weight: r.weight ?? undefined,
        tempo: r.tempo ?? undefined,
        rest: r.rest ?? undefined,
        comment: r.comment ?? undefined,
      }));
    }

    const [workout] = await db
      .insert(workouts)
      .values({
        clientId: data.clientId,
        templateId: data.templateId,
        title: data.title,
        date: data.date,
      })
      .returning();
    if (rows.length) {
      await db.insert(workoutExercises).values(
        rows.map((r, i) => ({ ...r, order: r.order ?? i, workoutId: workout!.id })),
      );
    }
    const [client] = await db.select().from(clients).where(eq(clients.id, data.clientId));
    if (client?.userId) await notify(client.userId, "Назначена новая тренировка", "/c/workouts");
    res.status(201).json({ workout });
  }),
);

// Тренер: список тренировок клиента.
workoutsRouter.get(
  "/",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const clientId = z.string().uuid().parse(req.query.clientId);
    await assertTrainerClient(req.user!.sub, clientId);
    const rows = await db
      .select()
      .from(workouts)
      .where(eq(workouts.clientId, clientId))
      .orderBy(desc(workouts.date));
    res.json({ workouts: rows });
  }),
);

// Клиент: свои тренировки.
workoutsRouter.get(
  "/mine",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const rows = await db
      .select()
      .from(workouts)
      .where(eq(workouts.clientId, client.id))
      .orderBy(desc(workouts.date));
    res.json({ workouts: rows });
  }),
);

// Детали тренировки: упражнения (с инфо) + логи. Доступ — тренер или сам клиент.
workoutsRouter.get(
  "/:id",
  asyncH(async (req, res) => {
    const { workout, client } = await loadAuthorized(req);
    const rows = await db
      .select({
        we: workoutExercises,
        ex: exercises,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, workout.id))
      .orderBy(asc(workoutExercises.order));
    const logs = await db
      .select()
      .from(workoutLogs)
      .where(eq(workoutLogs.clientId, client.id));
    const items = rows.map((r) => ({
      ...r.we,
      exercise: r.ex,
      logs: logs
        .filter((l) => l.workoutExerciseId === r.we.id)
        .sort((a, b) => a.setNumber - b.setNumber),
    }));
    res.json({ workout, items });
  }),
);

const logSchema = z.object({
  workoutExerciseId: z.string().uuid(),
  setNumber: z.number().int().positive(),
  weight: z.number().optional(),
  reps: z.number().int().optional(),
  feeling: z.enum(["easy", "moderate", "hard", "very_hard"]).optional(),
});

// Клиент: записать подход в дневник.
workoutsRouter.post(
  "/:id/log",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const { workout, client } = await loadAuthorized(req);
    const data = logSchema.parse(req.body);
    // Проверяем, что упражнение из этой тренировки.
    const [we] = await db
      .select()
      .from(workoutExercises)
      .where(
        and(
          eq(workoutExercises.id, data.workoutExerciseId),
          eq(workoutExercises.workoutId, workout.id),
        ),
      );
    if (!we) throw new HttpError(404, "Упражнение не найдено в тренировке");
    const [log] = await db
      .insert(workoutLogs)
      .values({ ...data, clientId: client.id })
      .returning();
    await touchClientActivity(client.id);
    res.status(201).json({ log });
  }),
);

// Сменить статус тренировки (assigned/completed/skipped).
workoutsRouter.patch(
  "/:id/status",
  asyncH(async (req, res) => {
    const { workout, client } = await loadAuthorized(req);
    const { status } = z
      .object({ status: z.enum(["assigned", "completed", "skipped"]) })
      .parse(req.body);
    const [updated] = await db
      .update(workouts)
      .set({ status })
      .where(eq(workouts.id, workout.id))
      .returning();
    let earned: string[] = [];
    if (req.user!.role === "client") {
      await touchClientActivity(client.id);
      if (status === "completed") earned = await recomputeAchievements(client.id);
    }
    res.json({ workout: updated, earnedAchievements: earned });
  }),
);
