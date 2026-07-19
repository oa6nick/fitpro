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
