import { db } from "../db/client.js";
import { notifications } from "../db/schema.js";

/** Создаёт внутреннее уведомление (колокольчик). userId — получатель. */
export async function notify(userId: string, text: string, link?: string) {
  if (!userId) return;
  await db.insert(notifications).values({ userId, text, link });
}
