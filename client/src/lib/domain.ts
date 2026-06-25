// Доменные типы и метки (синхронизированы с server/src/db/schema.ts).

export type Role = "trainer" | "client";

export type FunnelStatus =
  | "new"
  | "profile_filled"
  | "call"
  | "awaiting_payment"
  | "active"
  | "frozen"
  | "ending"
  | "archived";

export const FUNNEL_ORDER: FunnelStatus[] = [
  "new",
  "profile_filled",
  "call",
  "awaiting_payment",
  "active",
  "frozen",
  "ending",
  "archived",
];

export const FUNNEL_LABELS: Record<FunnelStatus, string> = {
  new: "Новая заявка",
  profile_filled: "Анкета заполнена",
  call: "Созвон",
  awaiting_payment: "Ожидает оплату",
  active: "Активный",
  frozen: "Заморожен",
  ending: "Заканчивает",
  archived: "Архив",
};

export const FUNNEL_COLORS: Record<FunnelStatus, string> = {
  new: "bg-sky-100 text-sky-700",
  profile_filled: "bg-indigo-100 text-indigo-700",
  call: "bg-violet-100 text-violet-700",
  awaiting_payment: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  frozen: "bg-slate-200 text-slate-600",
  ending: "bg-orange-100 text-orange-700",
  archived: "bg-zinc-100 text-zinc-500",
};

export const FEELING_LABELS: Record<string, string> = {
  easy: "Легко",
  moderate: "Умеренно",
  hard: "Тяжело",
  very_hard: "Очень тяжело",
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Client {
  id: string;
  trainerId: string;
  userId: string | null;
  name: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  level: string | null;
  workFormat: string | null;
  startDate: string | null;
  supportEndDate: string | null;
  funnelStatus: FunnelStatus;
  lastActivityAt: string | null;
  streakWeeks: number;
  createdAt: string;
  riskFlag?: boolean;
}

export interface ClientProfile {
  id: string;
  clientId: string;
  trainingExperience: string | null;
  injuries: string | null;
  lifestyle: string | null;
  nutrition: string | null;
  steps: number | null;
  equipment: string | null;
  preferences: string | null;
  dislikes: string | null;
  updatedAt: string;
}

export interface TrainerNote {
  id: string;
  clientId: string;
  text: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  trainerId: string;
  name: string;
  videoUrl: string | null;
  techniqueDescription: string | null;
  keyHints: string | null;
  commonMistakes: string | null;
  muscles: string | null;
  easierVariant: string | null;
  harderVariant: string | null;
  createdAt: string;
}

export interface Workout {
  id: string;
  clientId: string;
  templateId: string | null;
  title: string | null;
  date: string | null;
  status: "assigned" | "completed" | "skipped";
  createdAt: string;
}

export interface WorkoutExerciseRow {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  tempo: string | null;
  rest: string | null;
  comment: string | null;
  exercise: Exercise;
  logs: WorkoutLog[];
}

export interface WorkoutLog {
  id: string;
  workoutExerciseId: string;
  clientId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  feeling: "easy" | "moderate" | "hard" | "very_hard" | null;
  loggedAt: string;
}

export interface Measurement {
  id: string;
  clientId: string;
  date: string;
  weight: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  keyLifts: Record<string, number> | null;
  photoBeforeUrl: string | null;
  photoAfterUrl: string | null;
  createdAt: string;
}

export interface WorkoutTemplate {
  id: string;
  trainerId: string;
  name: string;
  goal: string | null;
  createdAt: string;
}

export interface TemplateItem {
  id: string;
  templateId: string;
  exerciseId: string;
  order: number;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  tempo: string | null;
  rest: string | null;
  comment: string | null;
}

/* --- Отчёты --- */
export type ReportFieldType = "number" | "text" | "photo" | "select";
export const REPORT_TYPE_LABELS: Record<ReportFieldType, string> = {
  number: "Число",
  text: "Текст",
  photo: "Фото",
  select: "Выбор",
};
export interface ReportField {
  id: string;
  formId: string;
  label: string;
  type: ReportFieldType;
  order: number;
}
export interface ReportForm {
  id: string;
  trainerId: string;
  name: string;
  createdAt: string;
  fields?: ReportField[];
}
export type ReportStatus = "awaiting_review" | "reviewed" | "missed";
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  awaiting_review: "Ожидает проверки",
  reviewed: "Проверен",
  missed: "Пропущен",
};
export interface ReportSubmission {
  id: string;
  formId: string;
  clientId: string;
  weekStart: string;
  status: ReportStatus;
  submittedAt: string | null;
  clientName?: string;
}
export interface ReportAnswer {
  id: string;
  submissionId: string;
  fieldId: string;
  value: string | null;
}

/* --- Задачи/привычки --- */
export interface HabitTask {
  id: string;
  trainerId: string;
  title: string;
  createdAt: string;
}
export interface TaskWeekItem {
  id: string;
  habitTaskId: string;
  title: string;
  weekStart: string;
  doneDays: string[];
  compliance: number;
}

/* --- База знаний --- */
export type KnowledgeCategory = "nutrition" | "training" | "measurements" | "recovery";
export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  nutrition: "Питание",
  training: "Тренировки",
  measurements: "Замеры",
  recovery: "Восстановление",
};
export type KnowledgeType = "pdf" | "video" | "checklist";
export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  pdf: "PDF",
  video: "Видео",
  checklist: "Чек-лист",
};
export interface KnowledgeItem {
  id: string;
  trainerId: string;
  category: KnowledgeCategory;
  title: string;
  type: KnowledgeType;
  fileUrl: string | null;
  unlockWeek: number;
  createdAt: string;
  locked?: boolean;
}

/* --- Финансы --- */
export type PaymentStatus = "paid" | "overdue";
export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  nextRenewalDate: string | null;
  clientName?: string;
}

/* --- Достижения / уведомления --- */
export interface Achievement {
  id: string;
  clientId: string;
  type: string;
  earnedAt: string;
}
export interface AppNotification {
  id: string;
  userId: string;
  text: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
