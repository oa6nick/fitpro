import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients } from "../db/schema.js";
import { HttpError } from "../lib/http.js";

/** Проверяет, что клиент принадлежит тренеру; возвращает запись клиента. */
export async function assertTrainerClient(trainerId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)));
  if (!client) throw new HttpError(404, "Клиент не найден");
  return client;
}

/** Возвращает карточку Client, привязанную к user-аккаунту клиента. */
export async function resolveClientForUser(userId: string) {
  const [client] = await db.select().from(clients).where(eq(clients.userId, userId));
  if (!client) throw new HttpError(404, "Профиль клиента не найден");
  return client;
}

/** Отметить активность клиента (для авто-метки «зона риска»). */
export async function touchClientActivity(clientId: string) {
  await db
    .update(clients)
    .set({ lastActivityAt: new Date() })
    .where(eq(clients.id, clientId));
}
