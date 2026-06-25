import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { notifications } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH } from "../lib/http.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncH(async (req, res) => {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user!.sub))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    res.json({
      notifications: rows,
      unread: rows.filter((n) => !n.read).length,
    });
  }),
);

notificationsRouter.post(
  "/:id/read",
  asyncH(async (req, res) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.user!.sub)));
    res.json({ ok: true });
  }),
);

notificationsRouter.post(
  "/read-all",
  asyncH(async (req, res) => {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, req.user!.sub));
    res.json({ ok: true });
  }),
);
