import { asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  workouts,
  workoutExercises,
  workoutLogs,
  exercises,
  measurements,
} from "../db/schema.js";

const FEELING_WEIGHT: Record<string, number> = {
  easy: 1,
  moderate: 2,
  hard: 3,
  very_hard: 4,
};

export type ClientAnalytics = {
  attendance: { total: number; completed: number; skipped: number; completionRate: number };
  weightProgression: { exercise: string; points: { date: string; weight: number }[] }[];
  heaviness: { date: string; avg: number }[];
  measurements: { date: string; weight: number | null; waist: number | null }[];
  tonnageByWeek: { week: string; kg: number }[];
  topLifts: { exercise: string; e1rm: number; weight: number; reps: number; date: string }[];
  prDeltas: { exercise: string; from: number; to: number; delta: number; sessions: number }[];
  summary: {
    totalTonnage: number;
    volumeTrendPct: number | null;
    loggedSets: number;
    streakWeeks: number;
  };
};

/** Сводная аналитика тренировок клиента (для тренера и самого клиента). */
export async function buildClientAnalytics(
  clientId: string,
  streakWeeks = 0,
): Promise<ClientAnalytics> {
  const ws = await db.select().from(workouts).where(eq(workouts.clientId, clientId));
  const total = ws.length;
  const completed = ws.filter((w) => w.status === "completed").length;
  const skipped = ws.filter((w) => w.status === "skipped").length;

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

  const byExercise: Record<string, Record<string, number>> = {};
  const heavinessByDay: Record<string, { sum: number; n: number }> = {};
  const tonnageByWeekMap: Record<string, number> = {};
  const bestE1rm: Record<
    string,
    { e1rm: number; weight: number; reps: number; date: string }
  > = {};

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
    const w = l.weight ?? 0;
    const r = l.reps ?? 0;
    if (w > 0 && r > 0) {
      const week = weekStartMonday(new Date(l.loggedAt));
      tonnageByWeekMap[week] = (tonnageByWeekMap[week] ?? 0) + w * r;
      const e1rm = Math.round(w * (1 + r / 30) * 10) / 10;
      const prev = bestE1rm[l.exName];
      if (!prev || e1rm > prev.e1rm) {
        bestE1rm[l.exName] = { e1rm, weight: w, reps: r, date: day };
      }
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

  const tonnageByWeek = Object.entries(tonnageByWeekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, kg]) => ({ week, kg: Math.round(kg) }));

  const topLifts = Object.entries(bestE1rm)
    .map(([exercise, v]) => ({ exercise, ...v }))
    .sort((a, b) => b.e1rm - a.e1rm)
    .slice(0, 8);

  const prDeltas = weightProgression
    .map((s) => {
      if (s.points.length < 2) return null;
      const first = s.points[0]!.weight;
      const last = s.points[s.points.length - 1]!.weight;
      return {
        exercise: s.exercise,
        from: first,
        to: last,
        delta: Math.round((last - first) * 10) / 10,
        sessions: s.points.length,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x && x.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 6);

  const ms = await db
    .select()
    .from(measurements)
    .where(eq(measurements.clientId, clientId))
    .orderBy(asc(measurements.date));

  const totalTonnage = tonnageByWeek.reduce((s, w) => s + w.kg, 0);
  const last4 = tonnageByWeek.slice(-4);
  const prev4 = tonnageByWeek.slice(-8, -4);
  const avg = (arr: { kg: number }[]) =>
    arr.length ? Math.round(arr.reduce((s, x) => s + x.kg, 0) / arr.length) : 0;
  const volumeTrend =
    prev4.length && avg(last4)
      ? Math.round(((avg(last4) - avg(prev4)) / Math.max(1, avg(prev4))) * 100)
      : null;

  return {
    attendance: {
      total,
      completed,
      skipped,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
    },
    weightProgression,
    heaviness,
    measurements: ms.map((m) => ({ date: m.date, weight: m.weight, waist: m.waist })),
    tonnageByWeek,
    topLifts,
    prDeltas,
    summary: {
      totalTonnage,
      volumeTrendPct: volumeTrend,
      loggedSets: logs.length,
      streakWeeks,
    },
  };
}

function weekStartMonday(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}
