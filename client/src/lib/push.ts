import { api } from "@/lib/api";

/** Base64URL → ArrayBuffer (формат VAPID-ключа для PushManager). */
function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

export const pushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Полный цикл подписки: разрешение → SW → PushManager → сервер. */
export async function subscribeToPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "Браузер не поддерживает уведомления" };

  const { key, enabled } = await api.get<{ key: string | null; enabled: boolean }>(
    "/push/vapid-public-key",
  );
  if (!enabled || !key) return { ok: false, reason: "Push не настроен на сервере" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "Уведомления запрещены" };

  const reg = await getRegistration();
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(key),
    }));

  await api.post("/push/subscribe", sub.toJSON());
  return { ok: true };
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await api.post("/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => null);
  await sub.unsubscribe();
}
