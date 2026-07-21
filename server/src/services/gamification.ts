import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workouts, achievements, measurements, clients } from "../db/schema.js";

/**
 * Начисление бейджей по событиям. Идемпотентно: тип бейджа уникален на клиента
 * (повторно не дублируем). Возвращает список вновь начисленных типов.
 */
async function award(clientId: string, type: string): Promise<string | null> {
  const [existing] = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(and(eq(achievements.clientId, clientId), eq(achievements.type, type)));
  if (existing) return null;
  await db.insert(achievements).values({ clientId, type });
  return type;
}

/** Понедельник недели YYYY-MM-DD (UTC day). */
function weekStartMonday(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

function prevWeekStart(week: string): string {
  const d = new Date(week + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Серия недель: сколько недель подряд (от текущей назад) была ≥1 completed workout.
 * Обновляет clients.streakWeeks.
 */
export async function recomputeStreakWeeks(clientId: string): Promise<number> {
  const completed = await db
    .select({ date: workouts.date, createdAt: workouts.createdAt })
    .from(workouts)
    .where(and(eq(workouts.clientId, clientId), eq(workouts.status, "completed")))
    .orderBy(desc(workouts.createdAt));

  const weeksWithWork = new Set<string>();
  for (const w of completed) {
    const when = w.date ? new Date(w.date + "T12:00:00.000Z") : w.createdAt;
    if (when) weeksWithWork.add(weekStartMonday(new Date(when)));
  }

  let streak = 0;
  let cursor = weekStartMonday(new Date());
  // Если на этой неделе ещё нет — считаем от прошлой (серия не сгорает в пн утром).
  if (!weeksWithWork.has(cursor)) {
    cursor = prevWeekStart(cursor);
  }
  while (weeksWithWork.has(cursor)) {
    streak += 1;
    cursor = prevWeekStart(cursor);
  }

  await db.update(clients).set({ streakWeeks: streak }).where(eq(clients.id, clientId));
  return streak;
}

/** Проверяет пороги достижений после события (тренировка/замер). */
export async function recomputeAchievements(clientId: string): Promise<string[]> {
  const earned: string[] = [];

  const completed = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.clientId, clientId), eq(workouts.status, "completed")));
  if (completed.length >= 1) {
    const a = await award(clientId, "Первая тренировка");
    if (a) earned.push(a);
  }
  if (completed.length >= 10) {
    const a = await award(clientId, "10 тренировок");
    if (a) earned.push(a);
  }
  if (completed.length >= 25) {
    const a = await award(clientId, "25 тренировок");
    if (a) earned.push(a);
  }

  const ms = await db
    .select({ id: measurements.id })
    .from(measurements)
    .where(eq(measurements.clientId, clientId));
  if (ms.length >= 3) {
    const a = await award(clientId, "3 замера");
    if (a) earned.push(a);
  }

  const streak = await recomputeStreakWeeks(clientId);
  if (streak >= 4) {
    const a = await award(clientId, "4 недели серии");
    if (a) earned.push(a);
  }
  if (streak >= 8) {
    const a = await award(clientId, "8 недель серии");
    if (a) earned.push(a);
  }

  return earned;
}
