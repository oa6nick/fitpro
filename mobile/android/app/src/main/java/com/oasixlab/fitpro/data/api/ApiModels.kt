package com.oasixlab.fitpro.data.api

import kotlinx.serialization.Serializable

// Модели повторяют JSON REST API сервера (server/src/routes). До появления
// OpenAPI-контракта (план Ф2) сверять вручную с zod-схемами.

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val role: String, // "trainer" | "client"
    val emailVerified: Boolean? = null,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    // Мобильный режим: сервер возвращает token в теле вместо httpOnly-cookie.
    val mobile: Boolean = true,
)

@Serializable
data class LoginResponse(val token: String, val user: User)

/** GET /api/auth/me — user==null значит «не авторизован» (сервер отвечает 200). */
@Serializable
data class MeResponse(val user: User? = null)

@Serializable
data class ApiErrorBody(val error: String? = null)

@Serializable
data class OkResponse(val ok: Boolean = true)

/* ---------------- Тренировки (client) ---------------- */

@Serializable
data class Workout(
    val id: String,
    val title: String? = null,
    val date: String? = null, // YYYY-MM-DD
    val status: String, // assigned | completed | skipped
    val tonnage: Double? = null,
    val clientFeeling: String? = null, // easy | moderate | hard | very_hard
    val clientComment: String? = null,
    val reviewStatus: String = "none",
    val trainerComment: String? = null,
)

@Serializable
data class WorkoutsResponse(val workouts: List<Workout>)

@Serializable
data class Exercise(
    val id: String,
    val name: String,
    val videoUrl: String? = null,
    val techniqueDescription: String? = null,
    val keyHints: String? = null,
    val commonMistakes: String? = null,
    val muscles: String? = null,
)

@Serializable
data class SetLog(
    val id: String,
    val workoutExerciseId: String,
    val setNumber: Int,
    val weight: Double? = null,
    val reps: Int? = null,
    val feeling: String? = null,
)

/** Элемент тренировки: поля workout_exercises + карточка упражнения + логи. */
@Serializable
data class WorkoutItem(
    val id: String,
    val exerciseId: String,
    val order: Int,
    val sets: Int? = null,
    val reps: String? = null, // текст: «8-12»
    val weight: String? = null, // текст: «60 кг»
    val tempo: String? = null,
    val rest: String? = null,
    val comment: String? = null,
    val groupKey: String? = null, // суперсет-ключ
    val groupType: String? = null, // superset | triset | circuit
    val exercise: Exercise,
    val logs: List<SetLog> = emptyList(),
)

@Serializable
data class WorkoutDetailResponse(val workout: Workout, val items: List<WorkoutItem>)

@Serializable
data class LogSetRequest(
    val workoutExerciseId: String,
    val setNumber: Int,
    val weight: Double? = null,
    val reps: Int? = null,
    val feeling: String? = null,
)

@Serializable
data class LogSetResponse(val log: SetLog)

@Serializable
data class DeleteLogRequest(val workoutExerciseId: String, val setNumber: Int)

@Serializable
data class WorkoutStatusRequest(
    val status: String,
    val feeling: String? = null,
    val comment: String? = null,
)

@Serializable
data class WorkoutStatusResponse(
    val workout: Workout,
    val earnedAchievements: List<String> = emptyList(),
)

/* ---------------- Замеры ---------------- */

@Serializable
data class Measurement(
    val id: String,
    val date: String,
    val weight: Double? = null,
    val waist: Double? = null,
    val hips: Double? = null,
    val chest: Double? = null,
    val keyLifts: Map<String, Double>? = null,
    val photoBeforeUrl: String? = null,
    val photoAfterUrl: String? = null,
)

@Serializable
data class MeasurementsResponse(val measurements: List<Measurement>)

@Serializable
data class CreateMeasurementRequest(
    val date: String,
    val weight: Double? = null,
    val waist: Double? = null,
    val hips: Double? = null,
    val chest: Double? = null,
    val photoBeforeUrl: String? = null,
    val photoAfterUrl: String? = null,
    // Тренер добавляет замер за клиента; у клиента игнорируется сервером.
    val clientId: String? = null,
)

@Serializable
data class MeasurementResponse(val measurement: Measurement)

/* ---------------- Привычки недели ---------------- */

@Serializable
data class WeekTask(
    val id: String, // id назначения (taskAssignments)
    val title: String,
    val weekStart: String,
    val doneDays: List<String> = emptyList(),
    val compliance: Int = 0,
)

@Serializable
data class TasksResponse(val weekStart: String, val tasks: List<WeekTask>)

@Serializable
data class ToggleTaskRequest(val date: String, val done: Boolean)

/* ---------------- Материалы ---------------- */

@Serializable
data class KnowledgeItem(
    val id: String,
    val category: String, // nutrition | training | measurements | recovery
    val title: String,
    val type: String, // pdf | video | checklist
    val unlockWeek: Int,
    // Тренерские GET/POST /api/knowledge отдают сырые строки БД без locked.
    val locked: Boolean = false,
    val fileUrl: String? = null, // null у заблокированных
)

@Serializable
data class KnowledgeResponse(val currentWeek: Int, val items: List<KnowledgeItem>)

/* ---------------- Регистрация и инвайты ---------------- */

@Serializable
data class RegisterRequest(val email: String, val password: String, val name: String)

/** register и invite/accept отвечают { user } и ставят cookie — токен добираем логином. */
@Serializable
data class UserResponse(val user: User)

@Serializable
data class InviteInfo(
    val trainerName: String,
    val clientName: String,
    val email: String? = null,
)

@Serializable
data class InviteInfoResponse(val invite: InviteInfo)

@Serializable
data class AcceptInviteRequest(val email: String, val password: String)

/* ---------------- Загрузка файлов ---------------- */

@Serializable
data class UploadResponse(val url: String)

/* ---------------- Отчёты ---------------- */

@Serializable
data class ReportForm(val id: String, val name: String)

@Serializable
data class ReportField(
    val id: String,
    val label: String,
    val type: String, // number | text | photo | select
    val order: Int = 0,
)

@Serializable
data class MyFormResponse(val form: ReportForm? = null, val fields: List<ReportField> = emptyList())

@Serializable
data class ReportSubmission(
    val id: String,
    val formId: String,
    val weekStart: String,
    val status: String, // awaiting_review | reviewed | missed
    val submittedAt: String? = null,
)

@Serializable
data class SubmissionsResponse(val submissions: List<ReportSubmission>)

@Serializable
data class SubmitAnswer(val fieldId: String, val value: String)

@Serializable
data class SubmitReportRequest(
    val formId: String,
    val weekStart: String,
    val answers: List<SubmitAnswer>,
)

@Serializable
data class SubmitReportResponse(val submission: ReportSubmission)

/* ---------------- Уведомления ---------------- */

@Serializable
data class NotificationItem(
    val id: String,
    val text: String,
    val link: String? = null,
    val read: Boolean = false,
    val createdAt: String,
)

@Serializable
data class NotificationsResponse(
    val notifications: List<NotificationItem>,
    val unread: Int = 0,
)

/* ---------------- Push-токены устройств ---------------- */

@Serializable
data class DeviceTokenRequest(val platform: String, val token: String)

/* ---------------- Кабинет тренера ---------------- */

@Serializable
class EmptyBody

@Serializable
data class DashboardCounts(
    val total: Int = 0,
    val active: Int = 0,
    val newRequests: Int = 0,
    val atRisk: Int = 0,
    val ending: Int = 0,
    val unreviewed: Int = 0,
)

@Serializable
data class UnreviewedWorkout(
    val id: String,
    val title: String? = null,
    val date: String? = null,
    val clientName: String,
)

@Serializable
data class RiskClient(val id: String, val name: String, val lastActivityAt: String? = null)

@Serializable
data class NewRequestClient(val id: String, val name: String, val funnelStatus: String)

@Serializable
data class EndingClient(val id: String, val name: String, val daysToEnd: Int)

@Serializable
data class DashboardResponse(
    val counts: DashboardCounts,
    val unreviewed: List<UnreviewedWorkout> = emptyList(),
    val atRisk: List<RiskClient> = emptyList(),
    val newRequests: List<NewRequestClient> = emptyList(),
    val ending: List<EndingClient> = emptyList(),
)

/** Карточка клиента в списках тренера (полная строка clients + riskFlag). */
@Serializable
data class TrainerClient(
    val id: String,
    val name: String,
    val goal: String? = null,
    val level: String? = null,
    val startDate: String? = null,
    val supportEndDate: String? = null,
    val funnelStatus: String,
    val lastActivityAt: String? = null,
    val streakWeeks: Int = 0,
    val isDemo: Boolean = false,
    val userId: String? = null,
    val riskFlag: Boolean = false,
)

@Serializable
data class TrainerClientsResponse(val clients: List<TrainerClient>)

@Serializable
data class TrainerNote(val id: String, val text: String, val createdAt: String)

@Serializable
data class ClientDetailResponse(
    val client: TrainerClient,
    val notes: List<TrainerNote> = emptyList(),
    val workouts: List<Workout> = emptyList(),
    val measurements: List<Measurement> = emptyList(),
)

@Serializable
data class ReviewWorkoutRequest(val comment: String? = null)

@Serializable
data class WorkoutResponse(val workout: Workout)

@Serializable
data class TrainerSubmission(
    val id: String,
    val clientId: String,
    val weekStart: String,
    val status: String,
    val submittedAt: String? = null,
    val clientName: String,
)

@Serializable
data class TrainerSubmissionsResponse(val submissions: List<TrainerSubmission>)

@Serializable
data class ReportAnswer(val fieldId: String, val value: String? = null)

@Serializable
data class SubmissionDetailResponse(
    val submission: ReportSubmission,
    val fields: List<ReportField> = emptyList(),
    val answers: List<ReportAnswer> = emptyList(),
)

@Serializable
data class SubmissionResponse(val submission: ReportSubmission)

/* ---------------- Конструкторы тренера ---------------- */

@Serializable
data class TrainerSubscription(
    val plan: String,
    val planTitle: String,
    val status: String,
    val paidUntil: String? = null,
    val clientLimit: Int = 0,
    val clientsUsed: Int = 0,
)

@Serializable
data class TrainerSubscriptionResponse(
    val subscription: TrainerSubscription? = null,
    val clientsUsed: Int = 0,
)

@Serializable
data class BillingPlan(
    val id: String,
    val title: String,
    val priceRub: Int,
    val clientLimit: Int,
)

@Serializable
data class BillingPlansResponse(val enabled: Boolean = false, val plans: List<BillingPlan>)

@Serializable
data class SubscribeRequest(val plan: String)

@Serializable
data class SubscribeResponse(val confirmationUrl: String, val paymentId: String)

/** POST /clients и PATCH /clients/:id (все поля опциональны при PATCH). */
@Serializable
data class ClientUpsertRequest(
    val name: String? = null,
    val age: Int? = null,
    val height: Double? = null,
    val weight: Double? = null,
    val goal: String? = null,
    val level: String? = null,
    val workFormat: String? = null,
    val startDate: String? = null,
    val supportEndDate: String? = null,
)

@Serializable
data class TrainerClientResponse(val client: TrainerClient)

@Serializable
data class FunnelStatusRequest(val status: String)

@Serializable
data class InviteCreateRequest(val email: String? = null)

@Serializable
data class InviteLinkResponse(val link: String, val expiresAt: String? = null)

@Serializable
data class NoteRequest(val text: String)

@Serializable
data class NoteResponse(val note: TrainerNote)

/** Анкета клиента: PUT /me/profile (клиент о себе) и PUT /clients/:id/profile (тренер). */
@Serializable
data class ClientProfile(
    val trainingExperience: String? = null,
    val injuries: String? = null,
    val lifestyle: String? = null,
    val nutrition: String? = null,
    val steps: Int? = null,
    val equipment: String? = null,
    val preferences: String? = null,
    val dislikes: String? = null,
)

@Serializable
data class ClientProfileResponse(val profile: ClientProfile? = null)

@Serializable
data class ExerciseUpsertRequest(
    val name: String,
    val videoUrl: String? = null,
    val techniqueDescription: String? = null,
    val keyHints: String? = null,
    val commonMistakes: String? = null,
    val muscles: String? = null,
)

@Serializable
data class ExercisesResponse(val exercises: List<Exercise>)

@Serializable
data class ExerciseResponse(val exercise: Exercise)

/** Строка упражнения шаблона/назначаемой тренировки (общая форма API). */
@Serializable
data class WorkoutItemDraft(
    val exerciseId: String,
    val order: Int? = null,
    val sets: Int? = null,
    val reps: String? = null,
    val weight: String? = null,
    val tempo: String? = null,
    val rest: String? = null,
    val comment: String? = null,
    val groupKey: String? = null,
    val groupType: String? = null,
)

@Serializable
data class WorkoutTemplate(
    val id: String,
    val name: String,
    val goal: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class TemplatesResponse(val templates: List<WorkoutTemplate>)

@Serializable
data class TemplateItemRow(
    val id: String,
    val exerciseId: String,
    val order: Int = 0,
    val sets: Int? = null,
    val reps: String? = null,
    val weight: String? = null,
    val tempo: String? = null,
    val rest: String? = null,
    val comment: String? = null,
    val groupKey: String? = null,
    val groupType: String? = null,
)

@Serializable
data class TemplateDetailResponse(val template: WorkoutTemplate, val items: List<TemplateItemRow>)

@Serializable
data class TemplateUpsertRequest(
    val name: String,
    val goal: String? = null,
    val items: List<WorkoutItemDraft> = emptyList(),
)

@Serializable
data class TemplateResponse(val template: WorkoutTemplate)

@Serializable
data class AssignWorkoutRequest(
    val clientId: String,
    val title: String? = null,
    val date: String? = null,
    val templateId: String? = null,
    val exercises: List<WorkoutItemDraft>? = null,
)

@Serializable
data class HabitTask(val id: String, val title: String)

@Serializable
data class HabitsResponse(val habits: List<HabitTask>)

@Serializable
data class HabitRequest(val title: String)

@Serializable
data class HabitResponse(val habit: HabitTask)

@Serializable
data class AssignHabitRequest(
    val clientId: String,
    val habitTaskId: String,
    val weekStart: String? = null,
)

@Serializable
data class KnowledgeCreateRequest(
    val category: String,
    val title: String,
    val type: String,
    val fileUrl: String? = null,
    val unlockWeek: Int = 1,
)

@Serializable
data class KnowledgeItemResponse(val item: KnowledgeItem)

@Serializable
data class KnowledgeAdminResponse(val items: List<KnowledgeItem>)

@Serializable
data class NewReportField(val label: String, val type: String, val order: Int? = null)

@Serializable
data class ReportFormCreateRequest(val name: String, val fields: List<NewReportField>)

@Serializable
data class ReportFormWithFields(
    val id: String,
    val name: String,
    val fields: List<ReportField> = emptyList(),
)

@Serializable
data class ReportFormsResponse(val forms: List<ReportFormWithFields>)

@Serializable
data class ReportFormResponse(val form: ReportForm)

@Serializable
data class FinancePayment(
    val id: String,
    val clientId: String,
    val amount: Double,
    val date: String,
    val status: String,
    val nextRenewalDate: String? = null,
    val periodStart: String? = null,
    val periodEnd: String? = null,
    val clientName: String? = null,
)

@Serializable
data class FinanceTotals(val paid: Double = 0.0, val overdue: Int = 0)

@Serializable
data class FinanceResponse(
    val payments: List<FinancePayment> = emptyList(),
    val totals: FinanceTotals = FinanceTotals(),
)

@Serializable
data class PaymentCreateRequest(
    val clientId: String,
    val amount: Double,
    val date: String,
    val status: String = "paid",
    val nextRenewalDate: String? = null,
    val periodStart: String? = null,
    val periodEnd: String? = null,
)

@Serializable
data class PaymentResponse(val payment: FinancePayment)

/* ---------------- Сводка клиента (/api/me/client) ---------------- */

@Serializable
data class ClientCard(
    val id: String,
    val name: String,
    val goal: String? = null,
    val level: String? = null,
    val startDate: String? = null,
    val supportEndDate: String? = null,
    val funnelStatus: String,
    val streakWeeks: Int = 0,
)

@Serializable
data class Achievement(val id: String, val type: String, val earnedAt: String)

@Serializable
data class PaymentInfo(
    val paidUntil: String? = null,
    val status: String, // paid | overdue
    val amount: Double = 0.0,
)

@Serializable
data class ClientSummaryResponse(
    val client: ClientCard,
    val achievements: List<Achievement> = emptyList(),
    val payment: PaymentInfo? = null,
)
