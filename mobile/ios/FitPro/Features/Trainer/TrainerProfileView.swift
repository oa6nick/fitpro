import SwiftUI

// Профиль тренера (Ф4): подписка, финансы, уведомления, выход.

@MainActor
@Observable
final class TrainerProfileModel {
    enum State {
        case loading
        case error(String)
        case ready
    }

    var state: State = .loading
    var subscription: TrainerSubscriptionResponse?
    var finance: FinanceResponse?
    var notifications: NotificationsResponse?
    var clients: [TrainerClientCard] = []
    var paymentError: String?
    var busy = false

    func load(api: APIClient) async {
        state = .loading
        do {
            subscription = try await api.get("/api/trainer/subscription")
            finance = try await api.get("/api/finance")
            state = .ready
        } catch {
            state = .error(error.localizedDescription)
        }
        // Уведомления и клиенты не критичны: при ошибке секции просто пустые.
        notifications = try? await api.get("/api/notifications")
        let res: TrainerClientsResponse? = try? await api.get("/api/clients")
        clients = res?.clients ?? []
    }

    func remind(api: APIClient, paymentId: String) async {
        busy = true
        defer { busy = false }
        let _: OkResponse? = try? await api.post(
            "/api/finance/\(paymentId)/remind", body: EmptyBody()
        )
    }

    /// true = сохранено (закрыть форму и перечитать данные).
    func addPayment(api: APIClient, request: PaymentCreateRequest) async -> Bool {
        do {
            let _: PaymentResponse = try await api.post("/api/finance", body: request)
            paymentError = nil
            await load(api: api)
            return true
        } catch {
            paymentError = error.localizedDescription
            return false
        }
    }

    func readAll(api: APIClient) async {
        let _: OkResponse? = try? await api.post("/api/notifications/read-all", body: EmptyBody())
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

/// Русские статусы подписки (server/src/services/plans.ts).
private let subscriptionStatusLabels = [
    "trial": "Пробный период",
    "active": "Активна",
    "expired": "Истекла",
]

struct TrainerProfileView: View {
    @Environment(AuthStore.self) private var auth
    let user: User

    @State private var model = TrainerProfileModel()
    @State private var showAddPayment = false

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
                case .ready:
                    content
                }
            }
            .navigationTitle("Профиль")
        }
        .task { await model.load(api: auth.api) }
        .sheet(isPresented: $showAddPayment) {
            AddPaymentSheet(clients: model.clients, errorText: model.paymentError) { request in
                Task {
                    if await model.addPayment(api: auth.api, request: request) {
                        showAddPayment = false
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.name)
                        .font(.headline)
                        .foregroundStyle(FPTheme.foreground)
                    Text(user.email)
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                }
            }
            .listRowBackground(FPTheme.card)

            subscriptionSection
            financeSection
            notificationsSection

            Section {
                Button("Выйти") { auth.logout() }
                    .foregroundStyle(FPTheme.destructiveSoft)
            }
            .listRowBackground(FPTheme.card)
        }
        .scrollContentBackground(.hidden)
    }

    /* ------------------------------ Подписка ------------------------------ */

    @ViewBuilder
    private var subscriptionSection: some View {
        Section("Подписка") {
            if let sub = model.subscription?.subscription {
                infoRow("Тариф", sub.planTitle)
                HStack {
                    Text("Статус").foregroundStyle(FPTheme.mutedForeground)
                    Spacer()
                    Text(subscriptionStatusLabels[sub.status] ?? sub.status)
                        .foregroundStyle(sub.status == "expired" ? FPTheme.destructiveSoft : FPTheme.success)
                }
                if let paidUntil = sub.paidUntil {
                    infoRow("Оплачено до", formatDate(paidUntil))
                }
                if sub.clientLimit > 0 {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Клиентов \(sub.clientsUsed) из \(sub.clientLimit)")
                            .font(.footnote)
                            .foregroundStyle(FPTheme.foreground)
                        ProgressView(
                            value: Double(min(sub.clientsUsed, sub.clientLimit)),
                            total: Double(sub.clientLimit)
                        )
                        .tint(FPTheme.primary)
                    }
                }
            } else {
                // Старые аккаунты без записи подписки: лимита нет.
                infoRow("Клиентов", "\(model.subscription?.clientsUsed ?? 0)")
            }
            Text("Управление подпиской — на сайте fitpro.oasixlab.com")
                .font(.footnote)
                .foregroundStyle(FPTheme.mutedForeground)
        }
        .listRowBackground(FPTheme.card)
    }

    /* ------------------------------ Финансы ------------------------------ */

    @ViewBuilder
    private var financeSection: some View {
        Section("Финансы") {
            if let finance = model.finance {
                HStack {
                    Text("Получено").foregroundStyle(FPTheme.mutedForeground)
                    Spacer()
                    Text("\(formatNumber(finance.totals.paid)) ₽")
                        .foregroundStyle(FPTheme.success)
                }
                if finance.totals.overdue > 0 {
                    HStack {
                        Text("Просрочено").foregroundStyle(FPTheme.mutedForeground)
                        Spacer()
                        Text("\(finance.totals.overdue)")
                            .foregroundStyle(FPTheme.destructiveSoft)
                    }
                }
                ForEach(finance.payments.prefix(5)) { payment in
                    paymentRow(payment)
                }
            }
            Button {
                showAddPayment = true
            } label: {
                Label("Добавить оплату", systemImage: "plus")
            }
            .foregroundStyle(FPTheme.primary)
        }
        .listRowBackground(FPTheme.card)
    }

    @ViewBuilder
    private func paymentRow(_ payment: FinancePayment) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(payment.clientName ?? "Клиент")
                    .font(.subheadline)
                    .foregroundStyle(FPTheme.foreground)
                Text("\(formatNumber(payment.amount)) ₽ · \(formatDate(payment.date))")
                    .font(.footnote)
                    .foregroundStyle(FPTheme.mutedForeground)
            }
            Spacer()
            if payment.status == "overdue" {
                Button("Напомнить") {
                    Task { await model.remind(api: auth.api, paymentId: payment.id) }
                }
                .font(.caption.weight(.medium))
                .buttonStyle(.bordered)
                .tint(FPTheme.warning)
                .disabled(model.busy)
            } else {
                Text("оплачено")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(FPTheme.success)
            }
        }
    }

    /* ---------------------------- Уведомления ---------------------------- */

    @ViewBuilder
    private var notificationsSection: some View {
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
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(FPTheme.mutedForeground)
            Spacer()
            Text(value).foregroundStyle(FPTheme.foreground)
        }
    }
}

/* --------------------------- Форма новой оплаты --------------------------- */

struct AddPaymentSheet: View {
    let clients: [TrainerClientCard]
    let errorText: String?
    let onSave: (PaymentCreateRequest) -> Void

    @State private var clientId = ""
    @State private var amount = ""
    @State private var date = ISO8601DateFormatter.dateOnly.string(from: .now)
    @State private var periodStart = ""
    @State private var periodEnd = ""

    var body: some View {
        NavigationStack {
            Form {
                Picker("Клиент", selection: $clientId) {
                    Text("Не выбран").tag("")
                    ForEach(clients) { client in
                        Text(client.name).tag(client.id)
                    }
                }
                TextField("Сумма, ₽", text: $amount).keyboardType(.decimalPad)
                TextField("Дата (ГГГГ-ММ-ДД)", text: $date)
                Section("Период сопровождения") {
                    TextField("С (ГГГГ-ММ-ДД)", text: $periodStart)
                    TextField("По (ГГГГ-ММ-ДД)", text: $periodEnd)
                }
                if let errorText {
                    Text(errorText).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                }
            }
            .navigationTitle("Новая оплата")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") {
                        onSave(
                            PaymentCreateRequest(
                                clientId: clientId,
                                amount: Double(amount.replacingOccurrences(of: ",", with: ".")) ?? 0,
                                date: date.trimmingCharacters(in: .whitespaces),
                                periodStart: periodStart.isEmpty ? nil : periodStart,
                                periodEnd: periodEnd.isEmpty ? nil : periodEnd
                            )
                        )
                    }
                    .disabled(clientId.isEmpty || Double(amount.replacingOccurrences(of: ",", with: ".")) == nil)
                }
            }
        }
        .presentationDetents([.large])
    }
}
