import { db } from "../db/client.js";
import { notifications } from "../db/schema.js";
import { sendPushToUsers } from "./push.js";

/**
 * Создаёт внутреннее уведомление (колокольчик) и, если у пользователя есть
 * push-подписка, дублирует его web-push'ем. Push не блокирует ответ API.
 */
export async function notify(userId: string, text: string, link?: string) {
  if (!userId) return;
  await db.insert(notifications).values({ userId, text, link });

  void sendPushToUsers([userId], "Coachly", text, link ?? "/").catch((err) =>
    console.error("notify: push:", err),
  );
}
