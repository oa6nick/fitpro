import { Router } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  clients,
  clientProfiles,
  trainerNotes,
  workouts,
  measurements,
  payments,
} from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { assertTrainerClient } from "../services/access.js";
import { isAtRisk } from "../services/risk.js";
import { asyncH } from "../lib/http.js";

export const clientsRouter = Router();
clientsRouter.use(requireAuth, requireRole("trainer"));

const FUNNEL = [
  "new",
  "profile_filled",
  "call",
  "awaiting_payment",
  "active",
  "frozen",
  "ending",
  "archived",
] as const;

const createSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  goal: z.string().optional(),
  level: z.string().optional(),
  workFormat: z.string().optional(),
  startDate: z.string().optional(),
  supportEndDate: z.string().optional(),
  funnelStatus: z.enum(FUNNEL).optional(),
});

const updateSchema = createSchema.partial();

// Список клиентов тренера (+ метка риска), опц. фильтр по статусу.
clientsRouter.get(
  "/",
  asyncH(async (req, res) => {
    const trainerId = req.user!.sub;
    const status = req.query.status as string | undefined;
    const where =
      status && (FUNNEL as readonly string[]).includes(status)
        ? and(eq(clients.trainerId, trainerId), eq(clients.funnelStatus, status as any))
        : eq(clients.trainerId, trainerId);
    const rows = await db
      .select()
      .from(clients)
      .where(where)
      .orderBy(desc(clients.createdAt));
    res.json({
      clients: rows.map((c) => ({ ...c, riskFlag: isAtRisk(c.lastActivityAt) })),
    });
  }),
);

clientsRouter.post(
  "/",
  asyncH(async (req, res) => {
    const data = createSchema.parse(req.body);
    const [created] = await db
      .insert(clients)
      .values({ ...data, trainerId: req.user!.sub })
      .returning();
    res.status(201).json({ client: created });
  }),
);

// Полная карточка клиента.
clientsRouter.get(
  "/:id",
  asyncH(async (req, res) => {
    const client = await assertTrainerClient(req.user!.sub, req.params.id);
    const [profile] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.clientId, client.id));
    const notes = await db
      .select()
      .from(trainerNotes)
      .where(eq(trainerNotes.clientId, client.id))
      .orderBy(desc(trainerNotes.createdAt));
    const clientWorkouts = await db
      .select()
      .from(workouts)
      .where(eq(workouts.clientId, client.id))
      .orderBy(desc(workouts.date));
    const clientMeasurements = await db
      .select()
      .from(measurements)
      .where(eq(measurements.clientId, client.id))
      .orderBy(desc(measurements.date));
    const clientPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, client.id))
      .orderBy(desc(payments.date));
    res.json({
      client: { ...client, riskFlag: isAtRisk(client.lastActivityAt) },
      profile: profile ?? null,
      notes,
      workouts: clientWorkouts,
      measurements: clientMeasurements,
      payments: clientPayments,
    });
  }),
);

clientsRouter.patch(
  "/:id",
  asyncH(async (req, res) => {
    await assertTrainerClient(req.user!.sub, req.params.id);
    const data = updateSchema.parse(req.body);
    const [updated] = await db
      .update(clients)
      .set(data)
      .where(eq(clients.id, req.params.id))
      .returning();
    res.json({ client: updated });
  }),
);

// Смена статуса воронки.
clientsRouter.patch(
  "/:id/status",
  asyncH(async (req, res) => {
    await assertTrainerClient(req.user!.sub, req.params.id);
    const { status } = z.object({ status: z.enum(FUNNEL) }).parse(req.body);
    const [updated] = await db
      .update(clients)
      .set({ funnelStatus: status })
      .where(eq(clients.id, req.params.id))
      .returning();
    res.json({ client: updated });
  }),
);

clientsRouter.delete(
  "/:id",
  asyncH(async (req, res) => {
    await assertTrainerClient(req.user!.sub, req.params.id);
    await db.delete(clients).where(eq(clients.id, req.params.id));
    res.json({ ok: true });
  }),
);

// --- Анкета (тренер тоже может видеть/править) ---
const profileSchema = z.object({
  trainingExperience: z.string().optional(),
  injuries: z.string().optional(),
  lifestyle: z.string().optional(),
  nutrition: z.string().optional(),
  steps: z.number().int().optional(),
  equipment: z.string().optional(),
  preferences: z.string().optional(),
  dislikes: z.string().optional(),
});

clientsRouter.put(
  "/:id/profile",
  asyncH(async (req, res) => {
    const client = await assertTrainerClient(req.user!.sub, req.params.id);
    const data = profileSchema.parse(req.body);
    const [existing] = await db
      .select()
      .from(clientProfiles)
      .where(eq(clientProfiles.clientId, client.id));
    let profile;
    if (existing) {
      [profile] = await db
        .update(clientProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clientProfiles.clientId, client.id))
        .returning();
    } else {
      [profile] = await db
        .insert(clientProfiles)
        .values({ clientId: client.id, ...data })
        .returning();
    }
    res.json({ profile });
  }),
);

// --- Заметки тренера ---
clientsRouter.post(
  "/:id/notes",
  asyncH(async (req, res) => {
    const client = await assertTrainerClient(req.user!.sub, req.params.id);
    const { text } = z.object({ text: z.string().min(1) }).parse(req.body);
    const [note] = await db
      .insert(trainerNotes)
      .values({ clientId: client.id, text })
      .returning();
    res.status(201).json({ note });
  }),
);

clientsRouter.delete(
  "/:id/notes/:noteId",
  asyncH(async (req, res) => {
    await assertTrainerClient(req.user!.sub, req.params.id);
    await db
      .delete(trainerNotes)
      .where(
        and(eq(trainerNotes.id, req.params.noteId), eq(trainerNotes.clientId, req.params.id)),
      );
    res.json({ ok: true });
  }),
);
