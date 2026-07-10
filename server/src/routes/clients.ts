import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  clients,
  clientInvites,
  clientProfiles,
  trainerNotes,
  trainerSubscriptions,
  users,
  workouts,
  measurements,
  payments,
} from "../db/schema.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { assertTrainerClient } from "../services/access.js";
import { isAtRisk } from "../services/risk.js";
import { asyncH, HttpError } from "../lib/http.js";
import { emailHtml, escapeHtml, sendEmail } from "../services/email.js";
import { env } from "../env.js";

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
    const trainerId = req.user!.sub;

    // Мягкий лимит тарифа (для аккаунтов без подписки — например seed — не режем).
    const [sub] = await db
      .select()
      .from(trainerSubscriptions)
      .where(eq(trainerSubscriptions.trainerId, trainerId));
    if (sub) {
      // Демо-клиент не занимает место в тарифе.
      const [{ value: total }] = await db
        .select({ value: count() })
        .from(clients)
        .where(and(eq(clients.trainerId, trainerId), eq(clients.isDemo, false)));
      if (total >= sub.clientLimit) {
        throw new HttpError(
          402,
          `Достигнут лимит тарифа (${sub.clientLimit} клиентов). Смените тариф, чтобы добавить больше.`,
        );
      }
    }

    const [created] = await db
      .insert(clients)
      .values({ ...data, trainerId })
      .returning();
    res.status(201).json({ client: created });
  }),
);

// Приглашение клиента в кабинет: ссылка /join/<token> (+ письмо, если у карточки есть email).
clientsRouter.post(
  "/:id/invite",
  asyncH(async (req, res) => {
    const trainerId = req.user!.sub;
    const client = await assertTrainerClient(trainerId, req.params.id);
    if (client.userId) throw new HttpError(409, "У клиента уже есть кабинет");

    const { email } = z.object({ email: z.string().email().optional() }).parse(req.body ?? {});

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    await db.insert(clientInvites).values({
      trainerId,
      clientId: client.id,
      email: email?.toLowerCase() ?? null,
      token,
      expiresAt,
    });

    const link = `${env.publicUrl}/join/${token}`;
    if (email) {
      const [trainer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, trainerId));
      void sendEmail({
        to: email,
        subject: "Приглашение в FitPro",
        html: emailHtml({
          title: "Вас приглашают в FitPro",
          intro: `Тренер ${escapeHtml(trainer?.name ?? "")} приглашает вас (${escapeHtml(client.name)}) в личный кабинет FitPro: тренировки, дневник, замеры и отчёты в одном месте.`,
          ctaText: "Принять приглашение",
          ctaUrl: link,
        }),
        text: `Тренер приглашает вас в FitPro. Ссылка: ${link} (действует 7 дней)`,
      }).catch((err) => console.error("invite email:", err));
    }

    res.status(201).json({ link, expiresAt });
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
