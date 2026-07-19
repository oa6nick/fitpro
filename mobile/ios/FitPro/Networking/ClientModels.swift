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

struct OkResponse: Codable {
    var ok: Bool = true
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
    let locked: Bool
    var fileUrl: String?
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
