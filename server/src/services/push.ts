import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { pushSubscriptions } from "../db/schema.js";
import { env } from "../env.js";

/**
 * Web-push через VAPID (перенос из SkillSpot).
 * Мёртвые подписки (404/410 — браузер отозвал) удаляем, чтобы не долбить впустую.
 */

let configured = false;
function ensureConfigured(): boolean {
  if (!env.pushEnabled) return false;
  if (!configured) {
    webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
    configured = true;
  }
  return true;
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url = "/",
  tag = "fitpro",
): Promise<number> {
  if (!ensureConfigured() || userIds.length === 0) return 0;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url, tag }),
      );
      sent += 1;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id))
          .catch(() => null);
      } else {
        console.error("web-push failed:", status ?? (err as Error).message);
      }
    }
  }
  return sent;
}
