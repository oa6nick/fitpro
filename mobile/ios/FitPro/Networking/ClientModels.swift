import Foundation

// Модели клиентской зоны — повторяют JSON REST API (server/src/routes).

struct Workout: Codable, Identifiable, Equatable {
    let id: String
    var title: String?
    var date: String? // YYYY-MM-DD
    var status: String // assigned | completed | skipped
    var tonnage: Double?
    var clientFeeling: String?
    var clientComment: String?
    var reviewStatus: String?
    var trainerComment: String?
}

struct WorkoutsResponse: Codable {
    let workouts: [Workout]
}

struct ExerciseCard: Codable, Equatable {
    let id: String
    let name: String
    var videoUrl: String?
    var techniqueDescription: String?
    var keyHints: String?
    var commonMistakes: String?
    var muscles: String?
}

struct SetLog: Codable, Identifiable, Equatable {
    let id: String
    let workoutExerciseId: String
    let setNumber: Int
    var weight: Double?
    var reps: Int?
    var feeling: String?
}

/// Элемент тренировки: поля workout_exercises + карточка упражнения + логи.
struct WorkoutItem: Codable, Identifiable, Equatable {
    let id: String
    let exerciseId: String
    let order: Int
    var sets: Int?
    var reps: String? // текст: «8-12»
    var weight: String? // текст: «60 кг»
    var tempo: String?
    var rest: String?
    var comment: String?
    var groupKey: String?
    var groupType: String? // superset | triset | circuit
    var exercise: ExerciseCard
    var logs: [SetLog]
}

struct WorkoutDetailResponse: Codable, Equatable {
    var workout: Workout
    var items: [WorkoutItem]
}

struct LogSetRequest: Encodable {
    let workoutExerciseId: String
    let setNumber: Int
    var weight: Double?
    var reps: Int?
    var feeling: String?
}

struct LogSetResponse: Codable {
    let log: SetLog
}

struct DeleteLogRequest: Encodable {
    let workoutExerciseId: String
    let setNumber: Int
}

struct WorkoutStatusRequest: Encodable {
    let status: String
    var feeling: String?
    var comment: String?
}

struct WorkoutStatusResponse: Codable {
    let workout: Workout
    var earnedAchievements: [String] = []
}

/// Универсальный «успех». Часть роутов отвечает не {ok:true}, а полезной
/// нагрузкой (например, POST /api/tasks/assign → {assignment}) — поэтому
/// отсутствие ключа ok не считаем ошибкой декодирования.
struct OkResponse: Codable {
    var ok: Bool = true

    private enum CodingKeys: String, CodingKey {
        case ok
    }

    init() {}

    init(from decoder: Decoder) throws {
        let c = try? decoder.container(keyedBy: CodingKeys.self)
        ok = (try? c?.decodeIfPresent(Bool.self, forKey: .ok)) ?? true
    }
}

struct Measurement: Codable, Identifiable, Equatable {
    let id: String
    let date: String
    var weight: Double?
    var waist: Double?
    var hips: Double?
    var chest: Double?
    var keyLifts: [String: Double]?
    var photoBeforeUrl: String?
    var photoAfterUrl: String?
}

struct MeasurementsResponse: Codable {
    let measurements: [Measurement]
}

struct CreateMeasurementRequest: Encodable {
    let date: String
    var weight: Double?
    var waist: Double?
    var hips: Double?
    var chest: Double?
    var photoBeforeUrl: String?
    var photoAfterUrl: String?
    /// Тренер создаёт замер за клиента; клиент поле не передаёт.
    var clientId: String?
}

struct MeasurementResponse: Codable {
    let measurement: Measurement
}

struct WeekTask: Codable, Identifiable, Equatable {
    let id: String // id назначения (taskAssignments)
    let title: String
    let weekStart: String
    var doneDays: [String]
    var compliance: Int
}

struct TasksResponse: Codable {
    let weekStart: String
    var tasks: [WeekTask]
}

struct ToggleTaskRequest: Encodable {
    let date: String
    let done: Bool
}

struct KnowledgeItem: Codable, Identifiable, Equatable {
    let id: String
    let category: String // nutrition | training | measurements | recovery
    let title: String
    let type: String // pdf | video | checklist
    let unlockWeek: Int
    var locked: Bool
    var fileUrl: String?

    private enum CodingKeys: String, CodingKey {
        case id, category, title, type, unlockWeek, locked, fileUrl
    }

    /// Тренерские ответы (GET/POST /api/knowledge) отдают сырые строки БД
    /// без поля locked — декодируем его с дефолтом false.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        category = try c.decode(String.self, forKey: .category)
        title = try c.decode(String.self, forKey: .title)
        type = try c.decode(String.self, forKey: .type)
        unlockWeek = try c.decode(Int.self, forKey: .unlockWeek)
        locked = try c.decodeIfPresent(Bool.self, forKey: .locked) ?? false
        fileUrl = try c.decodeIfPresent(String.self, forKey: .fileUrl)
    }
}

struct KnowledgeResponse: Codable {
    let currentWeek: Int
    let items: [KnowledgeItem]
}

/* Кабинет тренера */

struct EmptyBody: Encodable {}

struct DashboardCounts: Codable {
    var total = 0
    var active = 0
    var newRequests = 0
    var atRisk = 0
    var ending = 0
    var unreviewed = 0
}

struct UnreviewedWorkout: Codable, Identifiable, Equatable {
    let id: String
    var title: String?
    var date: String?
    let clientName: String
}

struct RiskClient: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    var lastActivityAt: String?
}

struct NewRequestClient: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let funnelStatus: String
}

struct EndingClient: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let daysToEnd: Int
}

struct DashboardResponse: Codable {
    let counts: DashboardCounts
    var unreviewed: [UnreviewedWorkout] = []
    var atRisk: [RiskClient] = []
    var newRequests: [NewRequestClient] = []
    var ending: [EndingClient] = []
}

struct TrainerClientCard: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    var goal: String?
    var level: String?
    var startDate: String?
    var supportEndDate: String?
    var funnelStatus: String
    var lastActivityAt: String?
    var streakWeeks: Int = 0
    var riskFlag: Bool = false
}

struct TrainerClientsResponse: Codable {
    let clients: [TrainerClientCard]
}

struct TrainerNoteItem: Codable, Identifiable, Equatable {
    let id: String
    let text: String
    let createdAt: String
}

struct ClientDetailResponse: Codable {
    let client: TrainerClientCard
    var notes: [TrainerNoteItem] = []
    var workouts: [Workout] = []
    var measurements: [Measurement] = []
}

struct ReviewWorkoutRequest: Encodable {
    var comment: String?
}

struct WorkoutOnlyResponse: Codable {
    let workout: Workout
}

struct TrainerSubmission: Codable, Identifiable, Equatable {
    let id: String
    let clientId: String
    let weekStart: String
    let status: String
    var submittedAt: String?
    let clientName: String
}

struct TrainerSubmissionsResponse: Codable {
    let submissions: [TrainerSubmission]
}

struct ReportAnswerItem: Codable, Equatable {
    let fieldId: String
    var value: String?
}

struct SubmissionDetailResponse: Codable {
    let submission: ReportSubmission
    var fields: [ReportField] = []
    var answers: [ReportAnswerItem] = []
}

struct SubmissionOnlyResponse: Codable {
    let submission: ReportSubmission
}

/* Оплата подписки (ЮKassa) — Android BillingPlan */

struct BillingPlan: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let priceRub: Int
    let clientLimit: Int
}

struct BillingPlansResponse: Codable {
    var enabled: Bool = false
    var plans: [BillingPlan] = []
}

struct SubscribeRequest: Encodable {
    let plan: String
}

struct SubscribeResponse: Codable {
    let confirmationUrl: String
    let paymentId: String
}

/* Конструкторы тренера (Ф4) — зеркала mobile/android ApiModels.kt */

/// GET /api/trainer/subscription (server/src/routes/trainer.ts).
struct TrainerSubscription: Codable, Equatable {
    let plan: String
    let planTitle: String
    let status: String // trial | active | expired
    var paidUntil: String?
    var clientLimit: Int = 0
    var clientsUsed: Int = 0
}

/// clientsUsed на верхнем уровне сервер шлёт только при subscription == null
/// (старые аккаунты без записи подписки) — декодируем с дефолтом.
struct TrainerSubscriptionResponse: Codable {
    var subscription: TrainerSubscription?
    var clientsUsed: Int = 0

    private enum CodingKeys: String, CodingKey {
        case subscription, clientsUsed
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        subscription = try c.decodeIfPresent(TrainerSubscription.self, forKey: .subscription)
        clientsUsed = try c.decodeIfPresent(Int.self, forKey: .clientsUsed) ?? 0
    }
}

/// POST /api/clients и PATCH /api/clients/{id} (при PATCH все поля опциональны).
struct ClientUpsertRequest: Encodable {
    var name: String?
    var age: Int?
    var height: Double?
    var weight: Double?
    var goal: String?
    var level: String?
    var workFormat: String?
    var startDate: String?
    var supportEndDate: String?
}

struct TrainerClientResponse: Codable {
    let client: TrainerClientCard
}

struct FunnelStatusRequest: Encodable {
    let status: String
}

struct InviteCreateRequest: Encodable {
    var email: String?
}

struct InviteLinkResponse: Codable {
    let link: String
    var expiresAt: String?
}

struct NoteRequest: Encodable {
    let text: String
}

struct NoteResponse: Codable {
    let note: TrainerNoteItem
}

/// Анкета клиента: PUT /api/me/profile (клиент) и PUT /api/clients/{id}/profile (тренер).
struct ClientProfileForm: Codable, Equatable {
    var trainingExperience: String?
    var injuries: String?
    var lifestyle: String?
    var nutrition: String?
    var steps: Int?
    var equipment: String?
    var preferences: String?
    var dislikes: String?
}

struct ClientProfileResponse: Codable {
    var profile: ClientProfileForm?
}

/* Библиотека упражнений */

/// Списки упражнений в конструкторах перебираются по id.
extension ExerciseCard: Identifiable {}

struct ExerciseUpsertRequest: Encodable {
    let name: String
    var videoUrl: String?
    var techniqueDescription: String?
    var keyHints: String?
    var commonMistakes: String?
    var muscles: String?
}

struct ExercisesResponse: Codable {
    let exercises: [ExerciseCard]
}

struct ExerciseResponse: Codable {
    let exercise: ExerciseCard
}

/* Шаблоны тренировок */

/// Строка упражнения шаблона/назначаемой тренировки (общая форма запросов API).
struct WorkoutItemDraft: Encodable {
    let exerciseId: String
    var order: Int?
    var sets: Int?
    var reps: String?
    var weight: String?
    var tempo: String?
    var rest: String?
    var comment: String?
    var groupKey: String?
    var groupType: String? // superset | triset | circuit
}

/// Строка сохранённого шаблона (GET /api/templates/{id}).
struct WorkoutTemplateItem: Codable, Identifiable, Equatable {
    let id: String
    let exerciseId: String
    var order: Int = 0
    var sets: Int?
    var reps: String?
    var weight: String?
    var tempo: String?
    var rest: String?
    var comment: String?
    var groupKey: String?
    var groupType: String?
}

struct WorkoutTemplateCard: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    var goal: String?
    var createdAt: String?
}

struct TemplatesResponse: Codable {
    let templates: [WorkoutTemplateCard]
}

struct TemplateDetailResponse: Codable {
    let template: WorkoutTemplateCard
    let items: [WorkoutTemplateItem]
}

struct TemplateUpsertRequest: Encodable {
    let name: String
    var goal: String?
    var items: [WorkoutItemDraft] = []
}

struct TemplateResponse: Codable {
    let template: WorkoutTemplateCard
}

/// POST /api/workouts — назначение тренировки клиенту (шаблон или ручной набор).
struct AssignWorkoutRequest: Encodable {
    let clientId: String
    var title: String?
    var date: String?
    var templateId: String?
    var exercises: [WorkoutItemDraft]?
}

/* Привычки */

struct HabitTask: Codable, Identifiable, Equatable {
    let id: String
    let title: String
}

struct HabitsResponse: Codable {
    let habits: [HabitTask]
}

struct HabitRequest: Encodable {
    let title: String
}

struct HabitResponse: Codable {
    let habit: HabitTask
}

struct AssignHabitRequest: Encodable {
    let clientId: String
    let habitTaskId: String
    var weekStart: String?
}

/* Материалы (админка тренера) */

struct KnowledgeCreateRequest: Encodable {
    let category: String // nutrition | training | measurements | recovery
    let title: String
    let type: String // pdf | video | checklist
    var fileUrl: String?
    var unlockWeek: Int = 1
}

struct KnowledgeItemResponse: Codable {
    let item: KnowledgeItem
}

struct KnowledgeAdminResponse: Codable {
    let items: [KnowledgeItem]
}

/* Конструктор форм отчётов */

struct NewReportField: Encodable {
    let label: String
    let type: String // number | text | photo | select
    var order: Int?
}

struct ReportFormCreateRequest: Encodable {
    let name: String
    let fields: [NewReportField]
}

struct ReportFormWithFields: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    var fields: [ReportField] = []
}

struct ReportFormsResponse: Codable {
    let forms: [ReportFormWithFields]
}

/// Ответ POST /api/reports/forms — { form } без полей.
struct ReportFormOnlyResponse: Codable {
    let form: ReportForm
}

/* Финансы тренера */

struct FinancePayment: Codable, Identifiable, Equatable {
    let id: String
    let clientId: String
    let amount: Double
    let date: String
    let status: String // paid | overdue
    var nextRenewalDate: String?
    var periodStart: String?
    var periodEnd: String?
    var clientName: String?
}

struct FinanceTotals: Codable, Equatable {
    var paid: Double = 0
    var overdue: Int = 0
}

struct FinanceResponse: Codable {
    var payments: [FinancePayment] = []
    var totals: FinanceTotals = FinanceTotals()
}

struct PaymentCreateRequest: Encodable {
    let clientId: String
    let amount: Double
    let date: String
    var status: String = "paid"
    var nextRenewalDate: String?
    var periodStart: String?
    var periodEnd: String?
}

struct PaymentResponse: Codable {
    let payment: FinancePayment
}

let funnelLabels = [
    "new": "Новая заявка",
    "profile_filled": "Анкета заполнена",
    "call": "Созвон",
    "awaiting_payment": "Ждёт оплату",
    "active": "Активный",
    "frozen": "Заморожен",
    "ending": "Заканчивает",
    "archived": "Архив",
]

let feelingLabels = [
    "easy": "легко",
    "moderate": "нормально",
    "hard": "тяжело",
    "very_hard": "очень тяжело",
]

/* Отчёты */

struct ReportForm: Codable, Equatable {
    let id: String
    let name: String
}

struct ReportField: Codable, Identifiable, Equatable {
    let id: String
    let label: String
    let type: String // number | text | photo | select
    var order: Int = 0
}

struct MyFormResponse: Codable {
    var form: ReportForm?
    var fields: [ReportField] = []
}

struct ReportSubmission: Codable, Identifiable, Equatable {
    let id: String
    let formId: String
    let weekStart: String
    let status: String // awaiting_review | reviewed | missed
    var submittedAt: String?
}

struct SubmissionsResponse: Codable {
    let submissions: [ReportSubmission]
}

struct SubmitAnswer: Encodable {
    let fieldId: String
    let value: String
}

struct SubmitReportRequest: Encodable {
    let formId: String
    let weekStart: String
    let answers: [SubmitAnswer]
}

struct SubmitReportResponse: Codable {
    let submission: ReportSubmission
}

/* Уведомления */

struct NotificationItem: Codable, Identifiable, Equatable {
    let id: String
    let text: String
    var link: String?
    var read: Bool = false
    let createdAt: String
}

struct NotificationsResponse: Codable {
    var notifications: [NotificationItem]
    var unread: Int = 0
}

struct ClientCard: Codable, Equatable {
    let id: String
    let name: String
    var goal: String?
    var level: String?
    var startDate: String?
    var supportEndDate: String?
    var funnelStatus: String
    var streakWeeks: Int = 0
}

struct Achievement: Codable, Identifiable, Equatable {
    let id: String
    let type: String
    let earnedAt: String
}

struct PaymentInfo: Codable, Equatable {
    var paidUntil: String?
    var status: String // paid | overdue
    var amount: Double = 0
}

struct ClientSummaryResponse: Codable {
    let client: ClientCard
    var achievements: [Achievement] = []
    var payment: PaymentInfo?
}
