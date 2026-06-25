import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { payments, clients } from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { assertTrainerClient, resolveClientForUser } from "../services/access.js";
import { notify } from "../services/notify.js";

export const financeRouter = Router();
financeRouter.use(requireAuth);

// Тренер: все оплаты по своим клиентам (+ имя клиента) или клиент: свои.
financeRouter.get(
  "/",
  asyncH(async (req, res) => {
    if (req.user!.role === "trainer") {
      const rows = await db
        .select({ p: payments, clientName: clients.name })
        .from(payments)
        .innerJoin(clients, eq(payments.clientId, clients.id))
        .where(eq(clients.trainerId, req.user!.sub))
        .orderBy(desc(payments.date));
      const list = rows.map((r) => ({ ...r.p, clientName: r.clientName }));
      res.json({
        payments: list,
        totals: {
          paid: list.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
          overdue: list.filter((p) => p.status === "overdue").length,
        },
      });
    } else {
      const client = await resolveClientForUser(req.user!.sub);
      const rows = await db
        .select()
        .from(payments)
        .where(eq(payments.clientId, client.id))
        .orderBy(desc(payments.date));
      res.json({ payments: rows, totals: { paid: 0, overdue: 0 } });
    }
  }),
);

const schema = z.object({
  clientId: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string(),
  status: z.enum(["paid", "overdue"]).default("paid"),
  nextRenewalDate: z.string().optional(),
});

financeRouter.post(
  "/",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const data = schema.parse(req.body);
    await assertTrainerClient(req.user!.sub, data.clientId);
    const [payment] = await db.insert(payments).values(data).returning();
    res.status(201).json({ payment });
  }),
);

// Напоминание клиенту об оплате (через колокольчик).
financeRouter.post(
  "/:id/remind",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const [p] = await db.select().from(payments).where(eq(payments.id, req.params.id));
    if (!p) throw new HttpError(404, "Оплата не найдена");
    const client = await assertTrainerClient(req.user!.sub, p.clientId);
    if (client.userId) await notify(client.userId, "Напоминание об оплате сопровождения", "/c");
    res.json({ ok: true });
  }),
);
