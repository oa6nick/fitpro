import { Router } from "express";
import { z } from "zod";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  reportForms,
  reportFields,
  reportSubmissions,
  reportAnswers,
  clients,
} from "../db/schema.js";
import { requireAuth } from "../auth/middleware.js";
import { asyncH, HttpError } from "../lib/http.js";
import { resolveClientForUser, touchClientActivity } from "../services/access.js";
import { notify } from "../services/notify.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

/* ----------------------------- Тренер ----------------------------- */

reportsRouter.get(
  "/forms",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const forms = await db
      .select()
      .from(reportForms)
      .where(eq(reportForms.trainerId, req.user!.sub))
      .orderBy(desc(reportForms.createdAt));
    const ids = forms.map((f) => f.id);
    const fields = ids.length
      ? await db.select().from(reportFields).where(inArray(reportFields.formId, ids))
      : [];
    res.json({
      forms: forms.map((f) => ({
        ...f,
        fields: fields.filter((x) => x.formId === f.id).sort((a, b) => a.order - b.order),
      })),
    });
  }),
);

const formSchema = z.object({
  name: z.string().min(1),
  fields: z
    .array(
      z.object({
        label: z.string().min(1),
        type: z.enum(["number", "text", "photo", "select"]),
        order: z.number().int().optional(),
      }),
    )
    .default([]),
});

reportsRouter.post(
  "/forms",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const data = formSchema.parse(req.body);
    const [form] = await db
      .insert(reportForms)
      .values({ trainerId: req.user!.sub, name: data.name })
      .returning();
    if (data.fields.length) {
      await db
        .insert(reportFields)
        .values(data.fields.map((f, i) => ({ ...f, order: f.order ?? i, formId: form!.id })));
    }
    res.status(201).json({ form });
  }),
);

reportsRouter.delete(
  "/forms/:id",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    await db
      .delete(reportForms)
      .where(and(eq(reportForms.id, req.params.id), eq(reportForms.trainerId, req.user!.sub)));
    res.json({ ok: true });
  }),
);

// Список заполнений по всем клиентам тренера (+фильтр по статусу).
reportsRouter.get(
  "/submissions",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const status = req.query.status as string | undefined;
    const rows = await db
      .select({
        sub: reportSubmissions,
        clientName: clients.name,
      })
      .from(reportSubmissions)
      .innerJoin(clients, eq(reportSubmissions.clientId, clients.id))
      .where(
        status
          ? and(eq(clients.trainerId, req.user!.sub), eq(reportSubmissions.status, status as any))
          : eq(clients.trainerId, req.user!.sub),
      )
      .orderBy(desc(reportSubmissions.submittedAt));
    res.json({ submissions: rows.map((r) => ({ ...r.sub, clientName: r.clientName })) });
  }),
);

// Детали одного заполнения (ответы + поля).
reportsRouter.get(
  "/submissions/:id",
  asyncH(async (req, res) => {
    const [sub] = await db
      .select()
      .from(reportSubmissions)
      .where(eq(reportSubmissions.id, req.params.id));
    if (!sub) throw new HttpError(404, "Отчёт не найден");
    // Доступ: тренер этого клиента или сам клиент.
    const [client] = await db.select().from(clients).where(eq(clients.id, sub.clientId));
    if (!client) throw new HttpError(404, "Клиент не найден");
    if (req.user!.role === "trainer" ? client.trainerId !== req.user!.sub : client.userId !== req.user!.sub) {
      throw new HttpError(403, "Недостаточно прав");
    }
    const fields = await db
      .select()
      .from(reportFields)
      .where(eq(reportFields.formId, sub.formId))
      .orderBy(asc(reportFields.order));
    const answers = await db
      .select()
      .from(reportAnswers)
      .where(eq(reportAnswers.submissionId, sub.id));
    res.json({
      submission: sub,
      fields,
      answers,
    });
  }),
);

reportsRouter.patch(
  "/submissions/:id/review",
  asyncH(async (req, res) => {
    if (req.user!.role !== "trainer") throw new HttpError(403, "Только для тренера");
    const [sub] = await db
      .select()
      .from(reportSubmissions)
      .where(eq(reportSubmissions.id, req.params.id));
    if (!sub) throw new HttpError(404, "Отчёт не найден");
    const [client] = await db.select().from(clients).where(eq(clients.id, sub.clientId));
    if (!client || client.trainerId !== req.user!.sub) throw new HttpError(403, "Недостаточно прав");
    const [updated] = await db
      .update(reportSubmissions)
      .set({ status: "reviewed" })
      .where(eq(reportSubmissions.id, sub.id))
      .returning();
    if (client.userId) await notify(client.userId, "Тренер проверил ваш отчёт", "/c/reports");
    res.json({ submission: updated });
  }),
);

/* ----------------------------- Клиент ----------------------------- */

// Форма отчёта, заданная тренером клиента (берём последнюю).
reportsRouter.get(
  "/my-form",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const [form] = await db
      .select()
      .from(reportForms)
      .where(eq(reportForms.trainerId, client.trainerId))
      .orderBy(desc(reportForms.createdAt));
    if (!form) return res.json({ form: null, fields: [] });
    const fields = await db
      .select()
      .from(reportFields)
      .where(eq(reportFields.formId, form.id))
      .orderBy(asc(reportFields.order));
    res.json({ form, fields });
  }),
);

reportsRouter.get(
  "/mine",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const rows = await db
      .select()
      .from(reportSubmissions)
      .where(eq(reportSubmissions.clientId, client.id))
      .orderBy(desc(reportSubmissions.weekStart));
    res.json({ submissions: rows });
  }),
);

const submitSchema = z.object({
  formId: z.string().uuid(),
  weekStart: z.string(),
  answers: z.array(z.object({ fieldId: z.string().uuid(), value: z.string() })).default([]),
});

reportsRouter.post(
  "/submit",
  asyncH(async (req, res) => {
    if (req.user!.role !== "client") throw new HttpError(403, "Только для клиента");
    const client = await resolveClientForUser(req.user!.sub);
    const data = submitSchema.parse(req.body);
    // Форма должна принадлежать тренеру этого клиента (не чужая/произвольная).
    const [form] = await db
      .select({ id: reportForms.id })
      .from(reportForms)
      .where(and(eq(reportForms.id, data.formId), eq(reportForms.trainerId, client.trainerId)));
    if (!form) throw new HttpError(404, "Форма отчёта не найдена");
    // Ответы принимаем только по полям этой формы (чужие fieldId отсекаем).
    const formFields = await db
      .select({ id: reportFields.id })
      .from(reportFields)
      .where(eq(reportFields.formId, data.formId));
    const allowed = new Set(formFields.map((f) => f.id));
    const answers = data.answers.filter((a) => allowed.has(a.fieldId));

    const [sub] = await db
      .insert(reportSubmissions)
      .values({
        formId: data.formId,
        clientId: client.id,
        weekStart: data.weekStart,
        status: "awaiting_review",
      })
      .returning();
    if (answers.length) {
      await db
        .insert(reportAnswers)
        .values(answers.map((a) => ({ ...a, submissionId: sub!.id })));
    }
    await touchClientActivity(client.id);
    await notify(client.trainerId, `Новый отчёт от ${client.name}`, "/t/reports");
    res.status(201).json({ submission: sub });
  }),
);
