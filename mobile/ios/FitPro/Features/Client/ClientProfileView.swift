import SwiftUI

@MainActor
@Observable
final class ClientProfileModel {
    enum State {
        case loading
        case error(String)
        case ready(ClientSummaryResponse)
    }

    var state: State = .loading
    var notifications: NotificationsResponse?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: ClientSummaryResponse = try await api.get("/api/me/client")
            state = .ready(res)
        } catch {
            state = .error(error.localizedDescription)
        }
        // Уведомления не критичны для экрана: при ошибке секция просто скрыта.
        notifications = try? await api.get("/api/notifications")
    }

    func readAll(api: APIClient) async {
        struct Empty: Encodable {}
        let _: OkResponse? = try? await api.post("/api/notifications/read-all", body: Empty())
        if var current = notifications {
            current.notifications = current.notifications.map { item in
                var updated = item
                updated.read = true
                return updated
            }
            current.unread = 0
            notifications = current
        }
    }
}

/// Русские названия бейджей (server/src/services/gamification.ts).
private let achievementLabels = [
    "first_workout": "Первая тренировка",
    "three_measurements": "3 замера",
    "streak_4": "4 недели подряд",
]

struct ClientProfileView: View {
    @Environment(AuthStore.self) private var auth
    let user: User

    @State private var model = ClientProfileModel()

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                switch model.state {
                case .loading:
                    ProgressView().tint(FPTheme.primary)
                case .error(let message):
                    ErrorRetryView(message: message) {
                        Task { await model.load(api: auth.api) }
                    }
                case .ready(let summary):
                    content(summary)
                }
            }
            .navigationTitle("Профиль")
        }
        .task { await model.load(api: auth.api) }
    }

    @ViewBuilder
    private func content(_ summary: ClientSummaryResponse) -> some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 2) {
                    Text(summary.client.name)
                        .font(.headline)
                        .foregroundStyle(FPTheme.foreground)
                    Text(user.email)
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                }
            }
            .listRowBackground(FPTheme.card)

            Section("Программа") {
                infoRow("Цель", summary.client.goal ?? "—")
                infoRow("Уровень", summary.client.level ?? "—")
                infoRow("Старт", formatDate(summary.client.startDate))
                infoRow("Стрик", "\(summary.client.streakWeeks) нед.")
            }
            .listRowBackground(FPTheme.card)

            Section("Анкета") {
                NavigationLink("Заполнить / изменить") {
                    ClientProfileFormView(savePath: "/api/me/profile")
                }
                .foregroundStyle(FPTheme.foreground)
            }
            .listRowBackground(FPTheme.card)

            if let payment = summary.payment {
                Section("Оплата") {
                    infoRow("Оплачено до", formatDate(payment.paidUntil))
                    HStack {
                        Text("Статус").foregroundStyle(FPTheme.mutedForeground)
                        Spacer()
                        Text(payment.status == "paid" ? "оплачено" : "просрочено")
                            .foregroundStyle(payment.status == "paid" ? FPTheme.success : FPTheme.destructiveSoft)
                    }
                }
                .listRowBackground(FPTheme.card)
            }

            if !summary.achievements.isEmpty {
                Section("Достижения") {
                    ForEach(summary.achievements) { achievement in
                        Text("🏆 \(achievementLabels[achievement.type] ?? achievement.type)")
                            .foregroundStyle(FPTheme.foreground)
                    }
                }
                .listRowBackground(FPTheme.card)
            }

            if let data = model.notifications, !data.notifications.isEmpty {
                Section {
                    ForEach(data.notifications.prefix(10)) { notification in
                        Text((notification.read ? "" : "● ") + notification.text)
                            .foregroundStyle(
                                notification.read ? FPTheme.mutedForeground : FPTheme.foreground
                            )
                    }
                } header: {
                    HStack {
                        Text(data.unread > 0 ? "Уведомления (\(data.unread))" : "Уведомления")
                        Spacer()
                        if data.unread > 0 {
                            Button("Прочитать все") {
                                Task { await model.readAll(api: auth.api) }
                            }
                            .font(.caption)
                        }
                    }
                }
                .listRowBackground(FPTheme.card)
            }

            Section {
                Button("Выйти") { auth.logout() }
                    .foregroundStyle(FPTheme.destructiveSoft)
            }
            .listRowBackground(FPTheme.card)
        }
        .scrollContentBackground(.hidden)
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(FPTheme.mutedForeground)
            Spacer()
            Text(value).foregroundStyle(FPTheme.foreground)
        }
    }
}

/// Анкета клиента — общая форма: клиент шлёт PUT /api/me/profile,
/// тренер — PUT /api/clients/{id}/profile (см. TrainerClientDetailView).
/// TODO: форма открывается пустой — префилл появится, когда /api/me/client
/// начнёт отдавать типизированный profile (сейчас GET-эндпоинта анкеты нет).
struct ClientProfileFormView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss
    let savePath: String

    @State private var trainingExperience = ""
    @State private var injuries = ""
    @State private var lifestyle = ""
    @State private var nutrition = ""
    @State private var steps = ""
    @State private var equipment = ""
    @State private var preferences = ""
    @State private var dislikes = ""
    @State private var saveError: String?
    @State private var busy = false

    var body: some View {
        Form {
            Section("О тренировках") {
                TextField("Опыт тренировок", text: $trainingExperience, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Травмы и ограничения", text: $injuries, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Оборудование (зал/дом)", text: $equipment, axis: .vertical)
                    .lineLimit(1...3)
            }
            Section("Образ жизни") {
                TextField("Образ жизни, работа, сон", text: $lifestyle, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Питание сейчас", text: $nutrition, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Шагов в день", text: $steps).keyboardType(.numberPad)
            }
            Section("Предпочтения") {
                TextField("Что нравится", text: $preferences, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Что не нравится", text: $dislikes, axis: .vertical)
                    .lineLimit(2...4)
            }
            if let saveError {
                Text(saveError).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
            }
        }
        .navigationTitle("Анкета")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Сохранить") {
                    Task { await save() }
                }
                .disabled(busy)
            }
        }
    }

    private func save() async {
        busy = true
        defer { busy = false }
        let form = ClientProfileForm(
            trainingExperience: trainingExperience.isEmpty ? nil : trainingExperience,
            injuries: injuries.isEmpty ? nil : injuries,
            lifestyle: lifestyle.isEmpty ? nil : lifestyle,
            nutrition: nutrition.isEmpty ? nil : nutrition,
            steps: Int(steps),
            equipment: equipment.isEmpty ? nil : equipment,
            preferences: preferences.isEmpty ? nil : preferences,
            dislikes: dislikes.isEmpty ? nil : dislikes
        )
        do {
            let _: ClientProfileResponse = try await auth.api.put(savePath, body: form)
            dismiss()
        } catch {
            saveError = error.localizedDescription
        }
    }
}
