import { Router } from "express";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { pushSubscriptions } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH } from "../lib/http.js";
import { env } from "../env.js";

export const pushRouter = Router();

// Публичный ключ нужен фронту до подписки.
pushRouter.get("/vapid-public-key", (_req, res) => {
  res.json({ key: env.pushEnabled ? env.vapidPublicKey : null, enabled: env.pushEnabled });
});

pushRouter.use(requireAuth);

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

pushRouter.post(
  "/subscribe",
  asyncH(async (req, res) => {
    const data = subscriptionSchema.parse(req.body);
    const userId = req.user!.sub;

    // endpoint уникален: тот же браузер может переподписаться на другого юзера.
    const [existing] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint));

    if (existing) {
      await db
        .update(pushSubscriptions)
        .set({ userId, p256dh: data.keys.p256dh, auth: data.keys.auth })
        .where(eq(pushSubscriptions.id, existing.id));
      return res.json({ ok: true, updated: true });
    }

    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    });
    res.status(201).json({ ok: true });
  }),
);

pushRouter.post(
  "/unsubscribe",
  asyncH(async (req, res) => {
    const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, req.user!.sub),
        ),
      );
    res.json({ ok: true });
  }),
);
