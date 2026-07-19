import SwiftUI

// Кабинет тренера (Ф3): дашборд, клиенты, проверка дневников и отчётов, события.

/* ------------------------------ Дашборд ------------------------------ */

@MainActor
@Observable
final class TrainerDashboardModel {
    enum State {
        case loading
        case error(String)
        case ready(DashboardResponse)
    }

    var state: State = .loading

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: DashboardResponse = try await api.get("/api/dashboard")
            state = .ready(res)
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}

struct TrainerDashboardView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = TrainerDashboardModel()

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
                case .ready(let data):
                    content(data)
                }
            }
            .navigationTitle("Дашборд")
        }
        .task { await model.load(api: auth.api) }
    }

    @ViewBuilder
    private func content(_ data: DashboardResponse) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 10) {
                    statCard("Клиентов", data.counts.total)
                    statCard("Активных", data.counts.active)
                    statCard("Заявки", data.counts.newRequests)
                }
                HStack(spacing: 10) {
                    statCard("Зона риска", data.counts.atRisk, tone: FPTheme.warning)
                    statCard("Заканчивают", data.counts.ending, tone: FPTheme.info)
                    statCard("Непроверено", data.counts.unreviewed, tone: FPTheme.primary)
                }

                if !data.atRisk.isEmpty {
                    sectionTitle("Зона риска — 7+ дней без активности")
                    ForEach(data.atRisk) { client in
                        listCard(
                            client.name,
                            client.lastActivityAt.map { "Активность: \(formatDate($0))" }
                                ?? "Активности ещё не было"
                        )
                    }
                }
                if !data.ending.isEmpty {
                    sectionTitle("Сопровождение заканчивается")
                    ForEach(data.ending) { client in
                        listCard(client.name, "Осталось дней: \(client.daysToEnd)")
                    }
                }
                if !data.newRequests.isEmpty {
                    sectionTitle("Новые заявки")
                    ForEach(data.newRequests) { client in
                        listCard(client.name, funnelLabels[client.funnelStatus] ?? client.funnelStatus)
                    }
                }
            }
            .padding(16)
        }
    }

    private func statCard(_ label: String, _ value: Int, tone: Color? = nil) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(value)")
                .font(FPTheme.Typography.pageTitle())
                .foregroundStyle(value > 0 ? (tone ?? FPTheme.foreground) : FPTheme.foreground)
            Text(label)
                .font(.caption2)
                .foregroundStyle(FPTheme.mutedForeground)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(FPTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
    }
}

func sectionTitle(_ text: String) -> some View {
    Text(text)
        .font(.headline)
        .foregroundStyle(FPTheme.foreground)
        .padding(.top, 6)
}

func listCard(_ title: String, _ subtitle: String?) -> some View {
    VStack(alignment: .leading, spacing: 2) {
        Text(title).font(.subheadline.weight(.medium)).foregroundStyle(FPTheme.foreground)
        if let subtitle {
            Text(subtitle).font(.footnote).foregroundStyle(FPTheme.mutedForeground)
        }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(14)
    .background(FPTheme.card)
    .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
}

/* ------------------------------ Клиенты ------------------------------ */

@MainActor
@Observable
final class TrainerClientsModel {
    enum State {
        case loading
        case error(String)
        case ready([TrainerClientCard])
    }

    var state: State = .loading
    var detail: ClientDetailResponse?
    var formError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: TrainerClientsResponse = try await api.get("/api/clients")
            state = .ready(res.clients)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func loadDetail(api: APIClient, id: String) async -> ClientDetailResponse? {
        try? await api.get("/api/clients/\(id)")
    }

    /// true = создан (закрыть форму). При 402 сервер шлёт текст лимита тарифа —
    /// он попадёт в formError через APIError.message.
    func createClient(api: APIClient, request: ClientUpsertRequest) async -> Bool {
        do {
            let _: TrainerClientResponse = try await api.post("/api/clients", body: request)
            formError = nil
            await load(api: api)
            return true
        } catch {
            formError = error.localizedDescription
            return false
        }
    }
}

struct TrainerClientsView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = TrainerClientsModel()
    @State private var showAddClient = false

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
                case .ready(let clients):
                    List(clients) { client in
                        NavigationLink(value: client.id) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack(spacing: 4) {
                                        Text(client.name).foregroundStyle(FPTheme.foreground)
                                        if client.riskFlag && client.funnelStatus == "active" {
                                            Image(systemName: "exclamationmark.triangle.fill")
                                                .font(.caption)
                                                .foregroundStyle(FPTheme.warning)
                                        }
                                    }
                                    Text(client.goal ?? "—")
                                        .font(.footnote)
                                        .foregroundStyle(FPTheme.mutedForeground)
                                }
                                Spacer()
                                Text(funnelLabels[client.funnelStatus] ?? client.funnelStatus)
                                    .font(.caption2.weight(.medium))
                                    .foregroundStyle(FPTheme.primary)
                            }
                        }
                        .listRowBackground(FPTheme.card)
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .navigationTitle("Клиенты")
            .navigationDestination(for: String.self) { id in
                TrainerClientDetailView(clientId: id)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddClient = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .tint(FPTheme.primary)
                }
            }
        }
        .task { await model.load(api: auth.api) }
        .sheet(isPresented: $showAddClient) {
            ClientFormSheet(initial: nil, errorText: model.formError) { request in
                Task {
                    if await model.createClient(api: auth.api, request: request) {
                        showAddClient = false
                    }
                }
            }
        }
    }
}

/// Порядок статусов воронки для диалогов (funnelLabels — словарь, порядок не задаёт).
let funnelStatusOrder = [
    "new", "profile_filled", "call", "awaiting_payment",
    "active", "frozen", "ending", "archived",
]

/// Форма клиента: создание (initial == nil) и редактирование.
struct ClientFormSheet: View {
    let initial: TrainerClientCard?
    let errorText: String?
    let onSave: (ClientUpsertRequest) -> Void

    @State private var name: String
    @State private var goal: String
    @State private var level: String
    @State private var age = ""
    @State private var startDate: String
    @State private var supportEndDate: String

    init(
        initial: TrainerClientCard?,
        errorText: String?,
        onSave: @escaping (ClientUpsertRequest) -> Void
    ) {
        self.initial = initial
        self.errorText = errorText
        self.onSave = onSave
        _name = State(initialValue: initial?.name ?? "")
        _goal = State(initialValue: initial?.goal ?? "")
        _level = State(initialValue: initial?.level ?? "")
        _startDate = State(initialValue: initial?.startDate ?? "")
        _supportEndDate = State(initialValue: initial?.supportEndDate ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("Имя*", text: $name)
                TextField("Цель", text: $goal)
                TextField("Уровень (новичок/средний/опытный)", text: $level)
                TextField("Возраст", text: $age).keyboardType(.numberPad)
                TextField("Дата старта (ГГГГ-ММ-ДД)", text: $startDate)
                TextField("Конец сопровождения (ГГГГ-ММ-ДД)", text: $supportEndDate)
                if let errorText {
                    Text(errorText).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                }
            }
            .navigationTitle(initial == nil ? "Новый клиент" : "Редактировать")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") {
                        onSave(
                            ClientUpsertRequest(
                                name: name.trimmingCharacters(in: .whitespaces),
                                age: Int(age),
                                goal: goal.isEmpty ? nil : goal,
                                level: level.isEmpty ? nil : level,
                                startDate: startDate.isEmpty ? nil : startDate,
                                supportEndDate: supportEndDate.isEmpty ? nil : supportEndDate
                            )
                        )
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .presentationDetents([.large])
    }
}

struct TrainerClientDetailView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss
    let clientId: String
    @State private var detail: ClientDetailResponse?

    // Действия тренера над клиентом (Ф4).
    @State private var inviteLink: String?
    @State private var showStatusDialog = false
    @State private var showNoteAlert = false
    @State private var noteText = ""
    @State private var showEdit = false
    @State private var showMeasurement = false
    @State private var showDeleteConfirm = false
    @State private var actionError: String?
    @State private var busy = false

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            if let detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        listCard(detail.client.name, [
                            detail.client.goal,
                            detail.client.level,
                            funnelLabels[detail.client.funnelStatus],
                            "стрик \(detail.client.streakWeeks) нед.",
                        ].compactMap { $0 }.joined(separator: " · "))

                        actionsSection(detail)

                        if !detail.measurements.isEmpty {
                            sectionTitle("Последние замеры")
                            ForEach(detail.measurements.prefix(3)) { m in
                                listCard(
                                    formatDate(m.date),
                                    [m.weight.map { "вес \(formatNumber($0))" },
                                     m.waist.map { "талия \(formatNumber($0))" }]
                                        .compactMap { $0 }.joined(separator: " · ")
                                )
                            }
                        }
                        if !detail.workouts.isEmpty {
                            sectionTitle("Тренировки")
                            ForEach(detail.workouts.prefix(6)) { w in
                                listCard(w.title ?? "Тренировка", formatDate(w.date))
                            }
                        }
                        if !detail.notes.isEmpty {
                            sectionTitle("Заметки")
                            ForEach(detail.notes.prefix(5)) { note in
                                listCard(note.text, formatDate(note.createdAt))
                            }
                        }
                    }
                    .padding(16)
                }
            } else {
                ProgressView().tint(FPTheme.primary)
            }
        }
        .navigationTitle("Карточка клиента")
        .task { await reload() }
        .confirmationDialog("Статус воронки", isPresented: $showStatusDialog, titleVisibility: .visible) {
            ForEach(funnelStatusOrder, id: \.self) { status in
                Button(funnelLabels[status] ?? status) {
                    Task { await setStatus(status) }
                }
            }
            Button("Отмена", role: .cancel) {}
        }
        .alert("Новая заметка", isPresented: $showNoteAlert) {
            TextField("Текст заметки", text: $noteText)
            Button("Сохранить") {
                Task { await addNote() }
            }
            Button("Отмена", role: .cancel) {}
        }
        .alert(
            "Ошибка",
            isPresented: Binding(
                get: { actionError != nil },
                set: { if !$0 { actionError = nil } }
            )
        ) {
            Button("Ок", role: .cancel) {}
        } message: {
            Text(actionError ?? "")
        }
        .confirmationDialog("Удалить клиента?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
            Button("Удалить", role: .destructive) {
                Task { await deleteClient() }
            }
            Button("Отмена", role: .cancel) {}
        }
        .sheet(isPresented: $showEdit) {
            ClientFormSheet(initial: detail?.client, errorText: actionError) { request in
                Task { await updateClient(request) }
            }
        }
        .sheet(isPresented: $showMeasurement) {
            // Та же форма замера, что у клиента, но с clientId — тренер вносит за клиента.
            AddMeasurementSheet(errorText: actionError) { request in
                Task { await addMeasurement(request) }
            }
        }
    }

    /* ------------------------------ Действия ------------------------------ */

    @ViewBuilder
    private func actionsSection(_ detail: ClientDetailResponse) -> some View {
        sectionTitle("Действия")
        VStack(spacing: 8) {
            NavigationLink {
                AssignWorkoutView(clientId: clientId, clientName: detail.client.name)
            } label: {
                actionLabel("Назначить тренировку", "dumbbell.fill")
            }
            if let inviteLink {
                ShareLink(item: inviteLink) {
                    actionLabel("Поделиться инвайт-ссылкой", "square.and.arrow.up")
                }
            } else {
                Button {
                    Task { await createInvite() }
                } label: {
                    actionLabel("Инвайт-ссылка", "link")
                }
            }
            Button {
                showStatusDialog = true
            } label: {
                actionLabel("Статус воронки", "arrow.triangle.branch")
            }
            Button {
                noteText = ""
                showNoteAlert = true
            } label: {
                actionLabel("Заметка", "note.text")
            }
            NavigationLink {
                ClientProfileFormView(savePath: "/api/clients/\(clientId)/profile")
            } label: {
                actionLabel("Анкета", "list.clipboard")
            }
            Button {
                showMeasurement = true
            } label: {
                actionLabel("Добавить замер", "ruler")
            }
            Button {
                showEdit = true
            } label: {
                actionLabel("Редактировать", "pencil")
            }
            Button {
                showDeleteConfirm = true
            } label: {
                actionLabel("Удалить клиента", "trash", tone: FPTheme.destructiveSoft)
            }
        }
        .disabled(busy)
    }

    private func actionLabel(_ title: String, _ icon: String, tone: Color? = nil) -> some View {
        HStack {
            Image(systemName: icon)
                .frame(width: 24)
            Text(title)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(FPTheme.mutedForeground)
        }
        .font(.subheadline.weight(.medium))
        .foregroundStyle(tone ?? FPTheme.foreground)
        .padding(12)
        .background(FPTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
    }

    private func reload() async {
        detail = try? await auth.api.get("/api/clients/\(clientId)")
    }

    private func createInvite() async {
        busy = true
        defer { busy = false }
        do {
            let res: InviteLinkResponse = try await auth.api.post(
                "/api/clients/\(clientId)/invite", body: InviteCreateRequest()
            )
            inviteLink = res.link
        } catch {
            actionError = error.localizedDescription
        }
    }

    private func setStatus(_ status: String) async {
        busy = true
        defer { busy = false }
        do {
            let _: TrainerClientResponse = try await auth.api.patch(
                "/api/clients/\(clientId)/status", body: FunnelStatusRequest(status: status)
            )
            await reload()
        } catch {
            actionError = error.localizedDescription
        }
    }

    private func addNote() async {
        let text = noteText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        busy = true
        defer { busy = false }
        do {
            let _: NoteResponse = try await auth.api.post(
                "/api/clients/\(clientId)/notes", body: NoteRequest(text: text)
            )
            await reload()
        } catch {
            actionError = error.localizedDescription
        }
    }

    private func updateClient(_ request: ClientUpsertRequest) async {
        busy = true
        defer { busy = false }
        do {
            let _: TrainerClientResponse = try await auth.api.patch(
                "/api/clients/\(clientId)", body: request
            )
            showEdit = false
            actionError = nil
            await reload()
        } catch {
            actionError = error.localizedDescription
        }
    }

    private func addMeasurement(_ request: CreateMeasurementRequest) async {
        busy = true
        defer { busy = false }
        var payload = request
        payload.clientId = clientId
        do {
            let _: MeasurementResponse = try await auth.api.post("/api/measurements", body: payload)
            showMeasurement = false
            actionError = nil
            await reload()
        } catch {
            actionError = error.localizedDescription
        }
    }

    private func deleteClient() async {
        busy = true
        defer { busy = false }
        do {
            let _: OkResponse = try await auth.api.delete(
                "/api/clients/\(clientId)", body: EmptyBody()
            )
            dismiss()
        } catch {
            actionError = error.localizedDescription
        }
    }
}

/* ------------------------------ Проверка ------------------------------ */

@MainActor
@Observable
final class ReviewModel {
    var diaries: [UnreviewedWorkout] = []
    var reports: [TrainerSubmission] = []
    var loadError: String?
    var busy = false

    func load(api: APIClient) async {
        loadError = nil
        do {
            let dash: DashboardResponse = try await api.get("/api/dashboard")
            diaries = dash.unreviewed
            let subs: TrainerSubmissionsResponse =
                try await api.get("/api/reports/submissions?status=awaiting_review")
            reports = subs.submissions
        } catch {
            loadError = error.localizedDescription
        }
    }

    func reviewWorkout(api: APIClient, id: String, comment: String) async -> Bool {
        busy = true
        defer { busy = false }
        do {
            let _: WorkoutOnlyResponse = try await api.patch(
                "/api/workouts/\(id)/review",
                body: ReviewWorkoutRequest(comment: comment.isEmpty ? nil : comment)
            )
            await load(api: api)
            return true
        } catch {
            loadError = error.localizedDescription
            return false
        }
    }

    func reviewSubmission(api: APIClient, id: String) async -> Bool {
        busy = true
        defer { busy = false }
        do {
            let _: SubmissionOnlyResponse = try await api.patch(
                "/api/reports/submissions/\(id)/review",
                body: EmptyBody()
            )
            await load(api: api)
            return true
        } catch {
            loadError = error.localizedDescription
            return false
        }
    }
}

struct ReviewView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = ReviewModel()
    @State private var segment = 0

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                VStack(spacing: 12) {
                    Picker("Раздел", selection: $segment) {
                        Text("Дневники").tag(0)
                        Text("Отчёты").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    if segment == 0 {
                        if model.diaries.isEmpty {
                            EmptyStateView(
                                title: "Всё проверено",
                                subtitle: "Новые завершённые тренировки появятся здесь"
                            )
                            Spacer()
                        } else {
                            List(model.diaries) { workout in
                                NavigationLink(value: ReviewTarget.workout(workout.id)) {
                                    VStack(alignment: .leading) {
                                        Text("\(workout.clientName) — \(workout.title ?? "Тренировка")")
                                            .foregroundStyle(FPTheme.foreground)
                                        Text(formatDate(workout.date))
                                            .font(.footnote)
                                            .foregroundStyle(FPTheme.mutedForeground)
                                    }
                                }
                                .listRowBackground(FPTheme.card)
                            }
                            .scrollContentBackground(.hidden)
                        }
                    } else {
                        if model.reports.isEmpty {
                            EmptyStateView(
                                title: "Отчётов на проверке нет",
                                subtitle: "Сданные клиентами отчёты появятся здесь"
                            )
                            Spacer()
                        } else {
                            List(model.reports) { submission in
                                NavigationLink(value: ReviewTarget.submission(submission.id)) {
                                    VStack(alignment: .leading) {
                                        Text(submission.clientName).foregroundStyle(FPTheme.foreground)
                                        Text("Неделя с \(formatDate(submission.weekStart))")
                                            .font(.footnote)
                                            .foregroundStyle(FPTheme.mutedForeground)
                                    }
                                }
                                .listRowBackground(FPTheme.card)
                            }
                            .scrollContentBackground(.hidden)
                        }
                    }
                }
                // Иначе VStack центрируется в ZStack и сегменты уезжают в середину.
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
            .navigationTitle("Проверка")
            .navigationDestination(for: ReviewTarget.self) { target in
                switch target {
                case .workout(let id):
                    WorkoutReviewView(workoutId: id, model: model)
                case .submission(let id):
                    SubmissionReviewView(submissionId: id, model: model)
                }
            }
        }
        .task { await model.load(api: auth.api) }
    }
}

enum ReviewTarget: Hashable {
    case workout(String)
    case submission(String)
}

struct WorkoutReviewView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss
    let workoutId: String
    let model: ReviewModel

    @State private var detail: WorkoutDetailResponse?
    @State private var comment = ""

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            if let detail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(detail.workout.title ?? "Тренировка")
                            .font(FPTheme.Typography.pageTitle())
                            .foregroundStyle(FPTheme.foreground)
                        Text(
                            [formatDate(detail.workout.date),
                             detail.workout.tonnage.map { "тоннаж \(Int($0)) кг" },
                             detail.workout.clientFeeling.map { "самочувствие: \(feelingLabels[$0] ?? $0)" }]
                                .compactMap { $0 }.joined(separator: " · ")
                        )
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)

                        ForEach(detail.items.sorted { $0.order < $1.order }) { item in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.exercise.name)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(FPTheme.foreground)
                                if item.logs.isEmpty {
                                    Text("Подходы не записаны")
                                        .font(.footnote)
                                        .foregroundStyle(FPTheme.warning)
                                } else {
                                    ForEach(item.logs) { log in
                                        Text(
                                            "Подход \(log.setNumber): " +
                                                [log.weight.map { "\(formatNumber($0)) кг" },
                                                 log.reps.map { "\($0) повт." }]
                                                .compactMap { $0 }.joined(separator: " × ")
                                        )
                                        .font(.footnote)
                                        .foregroundStyle(FPTheme.foreground)
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(14)
                            .background(FPTheme.card)
                            .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
                        }

                        TextField("Комментарий клиенту", text: $comment, axis: .vertical)
                            .lineLimit(2...4)
                            .textFieldStyle(.roundedBorder)

                        Button {
                            Task {
                                if await model.reviewWorkout(api: auth.api, id: workoutId, comment: comment) {
                                    dismiss()
                                }
                            }
                        } label: {
                            Text("Проверено")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .background(FPTheme.primary)
                        .foregroundStyle(FPTheme.primaryForeground)
                        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                        .disabled(model.busy)
                    }
                    .padding(16)
                }
            } else {
                ProgressView().tint(FPTheme.primary)
            }
        }
        .navigationTitle("Дневник клиента")
        .task {
            detail = try? await auth.api.get("/api/workouts/\(workoutId)")
        }
    }
}

struct SubmissionReviewView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss
    let submissionId: String
    let model: ReviewModel

    @State private var detail: SubmissionDetailResponse?

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            if let detail {
                let answers = Dictionary(
                    uniqueKeysWithValues: detail.answers.map { ($0.fieldId, $0.value) }
                )
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Неделя с \(formatDate(detail.submission.weekStart))")
                            .font(.headline)
                            .foregroundStyle(FPTheme.foreground)
                        ForEach(detail.fields.sorted { $0.order < $1.order }) { field in
                            let value = answers[field.id] ?? nil
                            VStack(alignment: .leading, spacing: 4) {
                                Text(field.label)
                                    .font(.caption)
                                    .foregroundStyle(FPTheme.mutedForeground)
                                if field.type == "photo", let value, !value.isEmpty {
                                    AsyncImage(url: absoluteUrl(value)) { image in
                                        image.resizable().scaledToFit()
                                    } placeholder: {
                                        FPTheme.muted
                                    }
                                    .frame(maxHeight: 200)
                                    .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
                                } else {
                                    Text((value?.isEmpty == false) ? value! : "—")
                                        .foregroundStyle(FPTheme.foreground)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(14)
                            .background(FPTheme.card)
                            .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
                        }
                        Button {
                            Task {
                                if await model.reviewSubmission(api: auth.api, id: submissionId) {
                                    dismiss()
                                }
                            }
                        } label: {
                            Text("Проверено")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .background(FPTheme.primary)
                        .foregroundStyle(FPTheme.primaryForeground)
                        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                        .disabled(model.busy)
                    }
                    .padding(16)
                }
            } else {
                ProgressView().tint(FPTheme.primary)
            }
        }
        .navigationTitle("Отчёт клиента")
        .task {
            detail = try? await auth.api.get("/api/reports/submissions/\(submissionId)")
        }
    }
}

/* ------------------------------ События ------------------------------ */

struct TrainerNotificationsView: View {
    @Environment(AuthStore.self) private var auth
    @State private var data: NotificationsResponse?

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                if let data {
                    if data.notifications.isEmpty {
                        EmptyStateView(
                            title: "Уведомлений нет",
                            subtitle: "События клиентов появятся здесь"
                        )
                    } else {
                        List {
                            ForEach(data.notifications) { n in
                                Text((n.read ? "" : "● ") + n.text)
                                    .foregroundStyle(n.read ? FPTheme.mutedForeground : FPTheme.foreground)
                                    .listRowBackground(FPTheme.card)
                            }
                        }
                        .scrollContentBackground(.hidden)
                    }
                } else {
                    ProgressView().tint(FPTheme.primary)
                }
            }
            .navigationTitle("События")
            .toolbar {
                if (data?.unread ?? 0) > 0 {
                    ToolbarItem(placement: .primaryAction) {
                        Button("Прочитать все") {
                            Task {
                                struct Empty: Encodable {}
                                let _: OkResponse? = try? await auth.api.post(
                                    "/api/notifications/read-all", body: Empty()
                                )
                                await loadData()
                            }
                        }
                    }
                }
            }
        }
        .task { await loadData() }
    }

    private func loadData() async {
        data = try? await auth.api.get("/api/notifications")
    }
}
