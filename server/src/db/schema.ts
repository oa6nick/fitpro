import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["trainer", "client"]);

export const funnelStatus = pgEnum("funnel_status", [
  "new", // Новая заявка
  "profile_filled", // Анкета заполнена
  "call", // Созвон
  "awaiting_payment", // Ожидает оплату
  "active", // Активный
  "frozen", // Заморожен
  "ending", // Заканчивает
  "archived", // Архив
]);

export const workoutStatus = pgEnum("workout_status", [
  "assigned", // назначена
  "completed", // выполнена
  "skipped", // пропущена
]);

export const feeling = pgEnum("feeling", ["easy", "moderate", "hard", "very_hard"]);

export const reportFieldType = pgEnum("report_field_type", [
  "number",
  "text",
  "photo",
  "select",
]);

export const reportStatus = pgEnum("report_status", [
  "awaiting_review", // ожидает проверки
  "reviewed", // проверен
  "missed", // пропущен
]);

export const knowledgeCategory = pgEnum("knowledge_category", [
  "nutrition", // Питание
  "training", // Тренировки
  "measurements", // Замеры
  "recovery", // Восстановление
]);

export const knowledgeType = pgEnum("knowledge_type", ["pdf", "video", "checklist"]);

export const paymentStatus = pgEnum("payment_status", ["paid", "overdue"]);

/* ------------------------------------------------------------------ */
/* User                                                                */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull(),
  name: text("name").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Client (карточка клиента у тренера)                                 */
/* ------------------------------------------------------------------ */

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  age: integer("age"),
  height: real("height"), // см
  weight: real("weight"), // кг (текущий)
  goal: text("goal"),
  level: text("level"), // новичок/средний/продвинутый
  workFormat: text("work_format"), // онлайн/офлайн/гибрид
  startDate: date("start_date"),
  supportEndDate: date("support_end_date"),
  funnelStatus: funnelStatus("funnel_status").notNull().default("new"),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  streakWeeks: integer("streak_weeks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* ClientProfile (анкета, 1:1)                                         */
/* ------------------------------------------------------------------ */

export const clientProfiles = pgTable("client_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .unique()
    .references(() => clients.id, { onDelete: "cascade" }),
  trainingExperience: text("training_experience"),
  injuries: text("injuries"),
  lifestyle: text("lifestyle"),
  nutrition: text("nutrition"),
  steps: integer("steps"),
  equipment: text("equipment"),
  preferences: text("preferences"),
  dislikes: text("dislikes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* TrainerNote                                                         */
/* ------------------------------------------------------------------ */

export const trainerNotes = pgTable("trainer_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Exercise (библиотека упражнений тренера)                            */
/* ------------------------------------------------------------------ */

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  videoUrl: text("video_url"),
  techniqueDescription: text("technique_description"),
  keyHints: text("key_hints"),
  commonMistakes: text("common_mistakes"),
  muscles: text("muscles"),
  easierVariant: text("easier_variant"),
  harderVariant: text("harder_variant"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* WorkoutTemplate + TemplateExercise                                  */
/* ------------------------------------------------------------------ */

export const workoutTemplates = pgTable("workout_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templateExercises = pgTable("template_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => workoutTemplates.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  sets: integer("sets"),
  reps: text("reps"), // "8-12" допускается
  weight: text("weight"),
  tempo: text("tempo"),
  rest: text("rest"),
  comment: text("comment"),
});

/* ------------------------------------------------------------------ */
/* Workout + WorkoutExercise + WorkoutLog                              */
/* ------------------------------------------------------------------ */

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => workoutTemplates.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  date: date("date"),
  status: workoutStatus("status").notNull().default("assigned"),
  /** Суммарный тоннаж Σ(вес × повторы), считается при завершении тренировки. */
  tonnage: real("tonnage"),
  /** Обратная связь клиента по всей тренировке (переиспользуем enum feeling). */
  clientFeeling: feeling("client_feeling"),
  clientComment: text("client_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
  sets: integer("sets"),
  reps: text("reps"),
  weight: text("weight"),
  tempo: text("tempo"),
  rest: text("rest"),
  comment: text("comment"),
});

export const workoutLogs = pgTable("workout_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutExerciseId: uuid("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  weight: real("weight"),
  reps: integer("reps"),
  feeling: feeling("feeling"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Measurement                                                         */
/* ------------------------------------------------------------------ */

export const measurements = pgTable("measurements", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  weight: real("weight"),
  waist: real("waist"),
  hips: real("hips"),
  chest: real("chest"),
  keyLifts: jsonb("key_lifts").$type<Record<string, number>>(),
  photoBeforeUrl: text("photo_before_url"),
  photoAfterUrl: text("photo_after_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* ReportForm + ReportField + ReportSubmission + ReportAnswer          */
/* ------------------------------------------------------------------ */

export const reportForms = pgTable("report_forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reportFields = pgTable("report_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => reportForms.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  type: reportFieldType("type").notNull().default("text"),
  order: integer("order").notNull().default(0),
});

export const reportSubmissions = pgTable("report_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => reportForms.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  status: reportStatus("status").notNull().default("awaiting_review"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
});

export const reportAnswers = pgTable("report_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => reportSubmissions.id, { onDelete: "cascade" }),
  fieldId: uuid("field_id")
    .notNull()
    .references(() => reportFields.id, { onDelete: "cascade" }),
  value: text("value"),
});

/* ------------------------------------------------------------------ */
/* Task / Habit                                                        */
/* ------------------------------------------------------------------ */

export const habitTasks = pgTable("habit_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taskAssignments = pgTable("task_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  habitTaskId: uuid("habit_task_id")
    .notNull()
    .references(() => habitTasks.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
});

export const taskCompletions = pgTable("task_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => taskAssignments.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  done: boolean("done").notNull().default(false),
}, (t) => ({
  uniqAssignmentDate: unique().on(t.assignmentId, t.date),
}));

/* ------------------------------------------------------------------ */
/* KnowledgeItem + KnowledgeAccess                                     */
/* ------------------------------------------------------------------ */

export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: knowledgeCategory("category").notNull(),
  title: text("title").notNull(),
  type: knowledgeType("type").notNull(),
  fileUrl: text("file_url"),
  unlockWeek: integer("unlock_week").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeAccess = pgTable("knowledge_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => knowledgeItems.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
});

/* ------------------------------------------------------------------ */
/* Payment                                                             */
/* ------------------------------------------------------------------ */

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  date: date("date").notNull(),
  status: paymentStatus("status").notNull().default("paid"),
  nextRenewalDate: date("next_renewal_date"),
});

/* ------------------------------------------------------------------ */
/* Achievement                                                         */
/* ------------------------------------------------------------------ */

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Notification (колокольчик)                                          */
/* ------------------------------------------------------------------ */

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Relations                                                           */
/* ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ many }) => ({
  clientsAsTrainer: many(clients, { relationName: "trainerClients" }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  trainer: one(users, {
    fields: [clients.trainerId],
    references: [users.id],
    relationName: "trainerClients",
  }),
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  profile: one(clientProfiles, {
    fields: [clients.id],
    references: [clientProfiles.clientId],
  }),
  notes: many(trainerNotes),
  workouts: many(workouts),
  measurements: many(measurements),
  payments: many(payments),
  achievements: many(achievements),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one }) => ({
  client: one(clients, {
    fields: [clientProfiles.clientId],
    references: [clients.id],
  }),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  client: one(clients, { fields: [workouts.clientId], references: [clients.id] }),
  template: one(workoutTemplates, {
    fields: [workouts.templateId],
    references: [workoutTemplates.id],
  }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  logs: many(workoutLogs),
}));

export const workoutTemplatesRelations = relations(workoutTemplates, ({ many }) => ({
  items: many(templateExercises),
}));

export const templateExercisesRelations = relations(templateExercises, ({ one }) => ({
  template: one(workoutTemplates, {
    fields: [templateExercises.templateId],
    references: [workoutTemplates.id],
  }),
  exercise: one(exercises, {
    fields: [templateExercises.exerciseId],
    references: [exercises.id],
  }),
}));

/* ------------------------------------------------------------------ */
/* Онбординг: коды подтверждения, инвайты клиентов, подписка тренера   */
/* Статусы здесь — text (не pgEnum), чтобы миграции оставались         */
/* аддитивными и не требовали ALTER TYPE.                              */
/* ------------------------------------------------------------------ */

/** Одноразовые коды на email: подтверждение адреса и сброс пароля. */
export const authEmailCodes = pgTable("auth_email_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  purpose: text("purpose").notNull(), // 'verify' | 'reset'
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Приглашение клиента в кабинет: привязывает регистрацию к карточке clients. */
export const clientInvites = pgTable("client_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  email: text("email"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Подписка тренера на FitPro (trial при регистрации; оплата — позже, ЮKassa). */
export const trainerSubscriptions = pgTable("trainer_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("trial"), // trial | basic | pro | expert
  status: text("status").notNull().default("trial"), // trial | active | expired
  paidUntil: date("paid_until"),
  clientLimit: integer("client_limit").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
