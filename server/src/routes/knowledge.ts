import { Router } from "express";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { knowledgeItems } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { resolveClientForUser } from "../services/access.js";
import { currentSupportWeek } from "../services/weeks.js";

export const knowledgeRouter = Router();
knowledgeRouter.use(requireAuth);

/* ----------------------------- Тренер ----------------------------- */

knowledgeRouter.get(
  "/",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const rows = await db
      .select()
      .from(knowledgeItems)
      .where(eq(knowledgeItems.trainerId, req.user!.sub))
      .orderBy(asc(knowledgeItems.unlockWeek));
    res.json({ items: rows });
  }),
);

const schema = z.object({
  category: z.enum(["nutrition", "training", "measurements", "recovery"]),
  title: z.string().min(1),
  type: z.enum(["pdf", "video", "checklist"]),
  fileUrl: z.string().optional(),
  unlockWeek: z.number().int().positive().default(1),
});

knowledgeRouter.post(
  "/",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const data = schema.parse(req.body);
    const [item] = await db
      .insert(knowledgeItems)
      .values({ ...data, trainerId: req.user!.sub })
      .returning();
    res.status(201).json({ item });
  }),
);

knowledgeRouter.delete(
  "/:id",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    await db
      .delete(knowledgeItems)
      .where(and(eq(knowledgeItems.id, req.params.id), eq(knowledgeItems.trainerId, req.user!.sub)));
    res.json({ ok: true });
  }),
);

/* ----------------------------- Клиент ----------------------------- */

// Материалы тренера с поэтапным доступом: открыто то, что <= текущей неделе сопровождения.
knowledgeRouter.get(
  "/mine",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const week = currentSupportWeek(client.startDate);
    const rows = await db
      .select()
      .from(knowledgeItems)
      .where(eq(knowledgeItems.trainerId, client.trainerId))
      .orderBy(asc(knowledgeItems.unlockWeek));
    res.json({
      currentWeek: week,
      items: rows.map((it) => ({
        ...it,
        // Заблокированные материалы отдаём без fileUrl.
        locked: it.unlockWeek > week,
        fileUrl: it.unlockWeek > week ? null : it.fileUrl,
      })),
    });
  }),
);
