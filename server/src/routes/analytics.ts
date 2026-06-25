import { Router } from "express";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  workouts,
  workoutExercises,
  workoutLogs,
  exercises,
  measurements,
} from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH } from "../lib/http.js";
import { assertTrainerClient } from "../services/access.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireRole("trainer"));

const FEELING_WEIGHT: Record<string, number> = {
  easy: 1,
  moderate: 2,
  hard: 3,
  very_hard: 4,
};

// Аналитика по клиенту: прогрессия весов, посещаемость, тяжесть, замеры.
analyticsRouter.get(
  "/client/:id",
  asyncH(async (req, res) => {
    const clientId = z.string().uuid().parse(req.params.id);
    await assertTrainerClient(req.user!.sub, clientId);

    // Посещаемость / выполнение плана.
    const ws = await db.select().from(workouts).where(eq(workouts.clientId, clientId));
    const total = ws.length;
    const completed = ws.filter((w) => w.status === "completed").length;
    const skipped = ws.filter((w) => w.status === "skipped").length;

    // Логи с упражнением и датой.
    const logs = await db
      .select({
        weight: workoutLogs.weight,
        reps: workoutLogs.reps,
        feeling: workoutLogs.feeling,
        loggedAt: workoutLogs.loggedAt,
        exName: exercises.name,
      })
      .from(workoutLogs)
      .innerJoin(workoutExercises, eq(workoutLogs.workoutExerciseId, workoutExercises.id))
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutLogs.clientId, clientId))
      .orderBy(asc(workoutLogs.loggedAt));

    // Прогрессия рабочих весов: по упражнению -> макс. вес за день.
    const byExercise: Record<string, Record<string, number>> = {};
    const heavinessByDay: Record<string, { sum: number; n: number }> = {};
    for (const l of logs) {
      const day = new Date(l.loggedAt).toISOString().slice(0, 10);
      if (l.weight != null) {
        byExercise[l.exName] ??= {};
        byExercise[l.exName]![day] = Math.max(byExercise[l.exName]![day] ?? 0, l.weight);
      }
      if (l.feeling) {
        heavinessByDay[day] ??= { sum: 0, n: 0 };
        heavinessByDay[day]!.sum += FEELING_WEIGHT[l.feeling] ?? 0;
        heavinessByDay[day]!.n += 1;
      }
    }

    const weightProgression = Object.entries(byExercise).map(([name, days]) => ({
      exercise: name,
      points: Object.entries(days)
        .sort()
        .map(([date, weight]) => ({ date, weight })),
    }));

    const heaviness = Object.entries(heavinessByDay)
      .sort()
      .map(([date, v]) => ({ date, avg: Math.round((v.sum / v.n) * 10) / 10 }));

    // Замеры.
    const ms = await db
      .select()
      .from(measurements)
      .where(eq(measurements.clientId, clientId))
      .orderBy(asc(measurements.date));

    res.json({
      attendance: {
        total,
        completed,
        skipped,
        completionRate: total ? Math.round((completed / total) * 100) : 0,
      },
      weightProgression,
      heaviness,
      measurements: ms.map((m) => ({ date: m.date, weight: m.weight, waist: m.waist })),
    });
  }),
);
