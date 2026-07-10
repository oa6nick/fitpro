import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients, workouts } from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { asyncH } from "../lib/http.js";
import { isAtRisk, daysUntil } from "../services/risk.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth, requireRole("trainer"));

// Сводка для главного экрана тренера (виджеты).
dashboardRouter.get(
  "/",
  asyncH(async (req, res) => {
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.trainerId, req.user!.sub));

    const enriched = rows.map((c) => ({
      ...c,
      riskFlag: isAtRisk(c.lastActivityAt),
      daysToEnd: daysUntil(c.supportEndDate),
    }));

    const byStatus: Record<string, number> = {};
    for (const c of enriched) byStatus[c.funnelStatus] = (byStatus[c.funnelStatus] ?? 0) + 1;

    // Тренировки, завершённые клиентами и ждущие проверки.
    const clientIds = rows.map((c) => c.id);
    const unreviewed = clientIds.length
      ? await db
          .select({
            id: workouts.id,
            clientId: workouts.clientId,
            title: workouts.title,
            date: workouts.date,
          })
          .from(workouts)
          .where(
            and(inArray(workouts.clientId, clientIds), eq(workouts.reviewStatus, "pending")),
          )
          .orderBy(desc(workouts.date))
      : [];
    const nameById = new Map(rows.map((c) => [c.id, c.name]));

    res.json({
      counts: {
        total: enriched.length,
        active: enriched.filter((c) => c.funnelStatus === "active").length,
        newRequests: enriched.filter((c) =>
          ["new", "profile_filled"].includes(c.funnelStatus),
        ).length,
        atRisk: enriched.filter((c) => c.riskFlag && c.funnelStatus === "active").length,
        ending: enriched.filter(
          (c) => c.daysToEnd !== null && c.daysToEnd <= 7 && c.daysToEnd >= 0,
        ).length,
        unreviewed: unreviewed.length,
      },
      unreviewed: unreviewed.map((w) => ({
        id: w.id,
        title: w.title,
        date: w.date,
        clientName: nameById.get(w.clientId) ?? "",
      })),
      byStatus,
      atRisk: enriched
        .filter((c) => c.riskFlag && c.funnelStatus === "active")
        .map((c) => ({ id: c.id, name: c.name, lastActivityAt: c.lastActivityAt })),
      newRequests: enriched
        .filter((c) => ["new", "profile_filled"].includes(c.funnelStatus))
        .map((c) => ({ id: c.id, name: c.name, funnelStatus: c.funnelStatus })),
      ending: enriched
        .filter((c) => c.daysToEnd !== null && c.daysToEnd <= 7 && c.daysToEnd >= 0)
        .map((c) => ({ id: c.id, name: c.name, daysToEnd: c.daysToEnd })),
    });
  }),
);
