import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { workouts, achievements, measurements } from "../db/schema.js";

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

  const ms = await db
    .select({ id: measurements.id })
    .from(measurements)
    .where(eq(measurements.clientId, clientId));
  if (ms.length >= 3) {
    const a = await award(clientId, "3 замера");
    if (a) earned.push(a);
  }

  return earned;
}
