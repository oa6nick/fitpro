import { Router } from "express";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  habitTasks,
  taskAssignments,
  taskCompletions,
  clients,
} from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { assertTrainerClient, resolveClientForUser, touchClientActivity } from "../services/access.js";
import { notify } from "../services/notify.js";
import { weekStartOf } from "../services/weeks.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

/* ----------------------------- Тренер ----------------------------- */

tasksRouter.get(
  "/habits",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const rows = await db
      .select()
      .from(habitTasks)
      .where(eq(habitTasks.trainerId, req.user!.sub))
      .orderBy(desc(habitTasks.createdAt));
    res.json({ habits: rows });
  }),
);

tasksRouter.post(
  "/habits",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const { title } = z.object({ title: z.string().min(1) }).parse(req.body);
    const [habit] = await db
      .insert(habitTasks)
      .values({ trainerId: req.user!.sub, title })
      .returning();
    res.status(201).json({ habit });
  }),
);

tasksRouter.delete(
  "/habits/:id",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    await db
      .delete(habitTasks)
      .where(and(eq(habitTasks.id, req.params.id), eq(habitTasks.trainerId, req.user!.sub)));
    res.json({ ok: true });
  }),
);

const assignSchema = z.object({
  clientId: z.string().uuid(),
  habitTaskId: z.string().uuid(),
  weekStart: z.string().optional(),
});

tasksRouter.post(
  "/assign",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const data = assignSchema.parse(req.body);
    const client = await assertTrainerClient(req.user!.sub, data.clientId);
    // Привычка должна принадлежать тренеру (иначе назначил бы чужую).
    const [habit] = await db
      .select({ id: habitTasks.id })
      .from(habitTasks)
      .where(and(eq(habitTasks.id, data.habitTaskId), eq(habitTasks.trainerId, req.user!.sub)));
    if (!habit) throw new HttpError(404, "Привычка не найдена");
    const [assignment] = await db
      .insert(taskAssignments)
      .values({
        clientId: data.clientId,
        habitTaskId: data.habitTaskId,
        weekStart: data.weekStart ?? weekStartOf(),
      })
      .returning();
    if (client.userId) await notify(client.userId, "Назначена новая задача на неделю", "/c/tasks");
    res.status(201).json({ assignment });
  }),
);

// Сводка соблюдения по клиенту: задачи недели + % выполнения (done/7).
tasksRouter.get(
  "/compliance",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const clientId = z.string().uuid().parse(req.query.clientId);
    await assertTrainerClient(req.user!.sub, clientId);
    const weekStart = (req.query.weekStart as string) ?? weekStartOf();
    const rows = await buildWeek(clientId, weekStart);
    res.json({ weekStart, tasks: rows });
  }),
);

/* ----------------------------- Клиент ----------------------------- */

tasksRouter.get(
  "/mine",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const weekStart = (req.query.weekStart as string) ?? weekStartOf();
    const rows = await buildWeek(client.id, weekStart);
    res.json({ weekStart, tasks: rows });
  }),
);

const toggleSchema = z.object({ date: z.string(), done: z.boolean() });

tasksRouter.post(
  "/:assignmentId/toggle",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const { date, done } = toggleSchema.parse(req.body);
    const [assignment] = await db
      .select()
      .from(taskAssignments)
      .where(
        and(
          eq(taskAssignments.id, req.params.assignmentId),
          eq(taskAssignments.clientId, client.id),
        ),
      );
    if (!assignment) throw new HttpError(404, "Задача не найдена");

    const [existing] = await db
      .select()
      .from(taskCompletions)
      .where(
        and(
          eq(taskCompletions.assignmentId, assignment.id),
          eq(taskCompletions.date, date),
        ),
      );
    if (existing) {
      await db.update(taskCompletions).set({ done }).where(eq(taskCompletions.id, existing.id));
    } else {
      await db.insert(taskCompletions).values({ assignmentId: assignment.id, date, done });
    }
    await touchClientActivity(client.id);
    res.json({ ok: true });
  }),
);

/** Собирает задачи недели клиента с отметками и % соблюдения. */
async function buildWeek(clientId: string, weekStart: string) {
  const assignments = await db
    .select({ a: taskAssignments, title: habitTasks.title })
    .from(taskAssignments)
    .innerJoin(habitTasks, eq(taskAssignments.habitTaskId, habitTasks.id))
    .where(
      and(eq(taskAssignments.clientId, clientId), eq(taskAssignments.weekStart, weekStart)),
    );
  const ids = assignments.map((x) => x.a.id);
  const completions = ids.length
    ? await db
        .select()
        .from(taskCompletions)
        .where(inArray(taskCompletions.assignmentId, ids))
    : [];
  return assignments.map((x) => {
    const cs = completions.filter((c) => c.assignmentId === x.a.id && c.done);
    return {
      id: x.a.id,
      habitTaskId: x.a.habitTaskId,
      title: x.title,
      weekStart: x.a.weekStart,
      doneDays: cs.map((c) => c.date),
      compliance: Math.round((cs.length / 7) * 100),
    };
  });
}
