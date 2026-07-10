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

/** Проверяет, что упражнение принадлежит тренировке. */
async function assertWorkoutExercise(workoutId: string, workoutExerciseId: string) {
  const [we] = await db
    .select()
    .from(workoutExercises)
    .where(
      and(eq(workoutExercises.id, workoutExerciseId), eq(workoutExercises.workoutId, workoutId)),
    );
  if (!we) throw new HttpError(404, "Упражнение не найдено в тренировке");
  return we;
}

// Клиент: отметить подход выполненным (upsert по номеру подхода).
// Уникального индекса на (workoutExerciseId, setNumber) нет — на проде могли
// накопиться дубли, поэтому upsert делаем чтением.
workoutsRouter.post(
  "/:id/log",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const { workout, client } = await loadAuthorized(req);
    const data = logSchema.parse(req.body);
    await assertWorkoutExercise(workout.id, data.workoutExerciseId);

    const [existing] = await db
      .select()
      .from(workoutLogs)
      .where(
        and(
          eq(workoutLogs.workoutExerciseId, data.workoutExerciseId),
          eq(workoutLogs.setNumber, data.setNumber),
        ),
      );

    let log;
    if (existing) {
      [log] = await db
        .update(workoutLogs)
        .set({ weight: data.weight, reps: data.reps, feeling: data.feeling })
        .where(eq(workoutLogs.id, existing.id))
        .returning();
    } else {
      [log] = await db
        .insert(workoutLogs)
        .values({ ...data, clientId: client.id })
        .returning();
    }

    await touchClientActivity(client.id);
    res.status(existing ? 200 : 201).json({ log });
  }),
);

// Клиент: снять отметку с подхода (значения в форме на клиенте сохраняются).
workoutsRouter.delete(
  "/:id/log",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const { workout } = await loadAuthorized(req);
    const { workoutExerciseId, setNumber } = z
      .object({
        workoutExerciseId: z.string().uuid(),
        setNumber: z.number().int().positive(),
      })
      .parse(req.body);
    await assertWorkoutExercise(workout.id, workoutExerciseId);
    await db
      .delete(workoutLogs)
      .where(
        and(
          eq(workoutLogs.workoutExerciseId, workoutExerciseId),
          eq(workoutLogs.setNumber, setNumber),
        ),
      );
    res.json({ ok: true });
  }),
);

/** Тоннаж тренировки: Σ(вес × повторы) по всем записанным подходам. */
export async function computeTonnage(workoutId: string): Promise<number> {
  const rows = await db
    .select({ weight: workoutLogs.weight, reps: workoutLogs.reps })
    .from(workoutLogs)
    .innerJoin(workoutExercises, eq(workoutLogs.workoutExerciseId, workoutExercises.id))
    .where(eq(workoutExercises.workoutId, workoutId));
  return rows.reduce((sum, r) => sum + (r.weight ?? 0) * (r.reps ?? 0), 0);
}

const statusSchema = z.object({
  status: z.enum(["assigned", "completed", "skipped"]),
  feeling: z.enum(["easy", "moderate", "hard", "very_hard"]).optional(),
  comment: z.string().max(2000).optional(),
});

// Сменить статус тренировки. При завершении клиентом — считаем тоннаж и
// сохраняем самочувствие/комментарий по всей тренировке.
workoutsRouter.patch(
  "/:id/status",
  asyncH(async (req, res) => {
    const { workout, client } = await loadAuthorized(req);
    const data = statusSchema.parse(req.body);
    const isClient = req.user!.role === "client";

    const patch: Record<string, unknown> = { status: data.status };
    if (isClient && data.status === "completed") {
      patch.tonnage = await computeTonnage(workout.id);
      if (data.feeling) patch.clientFeeling = data.feeling;
      if (data.comment) patch.clientComment = data.comment;
      // Завершённая клиентом тренировка ждёт проверки тренером.
      patch.reviewStatus = "pending";
    }

    const [updated] = await db
      .update(workouts)
      .set(patch)
      .where(eq(workouts.id, workout.id))
      .returning();

    let earned: string[] = [];
    if (isClient) {
      await touchClientActivity(client.id);
      if (data.status === "completed") {
        earned = await recomputeAchievements(client.id);
        await notify(
          client.trainerId,
          `${client.name} завершил(а) тренировку${updated?.title ? ` «${updated.title}»` : ""}`,
          `/t/workouts/${workout.id}`,
        );
      }
    }
    res.json({ workout: updated, earnedAchievements: earned });
  }),
);

// Тренер: проверить тренировку и оставить комментарий.
workoutsRouter.patch(
  "/:id/review",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const { workout, client } = await loadAuthorized(req);
    const { comment } = z
      .object({ comment: z.string().max(2000).optional() })
      .parse(req.body ?? {});

    const [updated] = await db
      .update(workouts)
      .set({
        reviewStatus: "reviewed",
        reviewedAt: new Date(),
        trainerComment: comment ?? null,
      })
      .where(eq(workouts.id, workout.id))
      .returning();

    if (client.userId) {
      await notify(
        client.userId,
        comment
          ? "Тренер проверил тренировку и оставил комментарий"
          : "Тренер проверил вашу тренировку",
        `/c/workouts/${workout.id}`,
      );
    }
    res.json({ workout: updated });
  }),
);
