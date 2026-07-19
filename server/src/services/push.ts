import webpush from "web-push";
import { readFileSync } from "node:fs";
import { eq, inArray } from "drizzle-orm";
import type { Messaging } from "firebase-admin/messaging";
import { db } from "../db/client.js";
import { deviceTokens, pushSubscriptions } from "../db/schema.js";
import { env } from "../env.js";

/**
 * Push двумя каналами: web-push/VAPID (браузеры) и FCM (нативные Android/iOS).
 * Каждый канал включается своими ключами и молча выключен без них.
 * Мёртвые подписки/токены удаляем, чтобы не долбить впустую.
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

// firebase-admin тяжёлый — грузим динамически и только при включённом канале.
let messaging: Messaging | null = null;
let firebaseFailed = false;
async function ensureFirebase(): Promise<Messaging | null> {
  if (!env.nativePushEnabled || firebaseFailed) return null;
  if (messaging) return messaging;
  try {
    const { initializeApp, cert } = await import("firebase-admin/app");
    const { getMessaging } = await import("firebase-admin/messaging");
    const json = env.firebaseServiceAccountBase64
      ? Buffer.from(env.firebaseServiceAccountBase64, "base64").toString("utf8")
      : readFileSync(env.firebaseServiceAccountPath, "utf8");
    const app = initializeApp({ credential: cert(JSON.parse(json)) }, "fitpro-push");
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    // Битый ключ не должен ронять notify() на каждом событии — гасим канал до рестарта.
    firebaseFailed = true;
    console.error("FCM init failed:", (err as Error).message);
    return null;
  }
}

export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  url = "/",
  tag = "fitpro",
): Promise<number> {
  if (userIds.length === 0) return 0;
  const [web, native] = await Promise.all([
    sendWebPush(userIds, title, body, url, tag),
    sendNativePush(userIds, title, body, url, tag),
  ]);
  return web + native;
}

async function sendWebPush(
  userIds: string[],
  title: string,
  body: string,
  url: string,
  tag: string,
): Promise<number> {
  if (!ensureConfigured()) return 0;

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

async function sendNativePush(
  userIds: string[],
  title: string,
  body: string,
  url: string,
  tag: string,
): Promise<number> {
  const fcm = await ensureFirebase();
  if (!fcm) return 0;

  const tokens = await db
    .select()
    .from(deviceTokens)
    .where(inArray(deviceTokens.userId, userIds));
  if (tokens.length === 0) return 0;

  // FCM sendEachForMulticast — жёсткий лимит 500 токенов на вызов; чанкуем,
  // иначе при >500 бросит и НИКОМУ ничего не уйдёт.
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    try {
      const res = await fcm.sendEachForMulticast({
        tokens: chunk.map((t) => t.token),
        notification: { title, body },
        data: { url, tag },
        android: { priority: "high", notification: { channelId: "fitpro" } },
      });
      await Promise.all(
        res.responses.map(async (r, j) => {
          if (r.success) {
            sent += 1;
            return;
          }
          const code = r.error?.code ?? "";
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-argument")
          ) {
            await db
              .delete(deviceTokens)
              .where(eq(deviceTokens.token, chunk[j]!.token))
              .catch(() => null);
          } else {
            console.error("FCM failed:", code);
          }
        }),
      );
    } catch (err) {
      console.error("FCM multicast failed:", (err as Error).message);
    }
  }
  return sent;
}
