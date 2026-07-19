import SwiftUI
import UniformTypeIdentifiers

// Студия тренера (Ф4): библиотека упражнений, шаблоны тренировок,
// привычки, материалы и конструктор форм отчётов.

struct StudioView: View {
    @State private var segment = 0

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                VStack(spacing: 12) {
                    Picker("Раздел", selection: $segment) {
                        Text("Упражнения").tag(0)
                        Text("Шаблоны").tag(1)
                        Text("Привычки").tag(2)
                        Text("Материалы").tag(3)
                        Text("Формы").tag(4)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    switch segment {
                    case 0: StudioExercisesSection()
                    case 1: StudioTemplatesSection()
                    case 2: StudioHabitsSection()
                    case 3: StudioKnowledgeSection()
                    default: StudioFormsSection()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
            .navigationTitle("Студия")
        }
    }
}

/* ============================== Упражнения ============================== */

@MainActor
@Observable
final class StudioExercisesModel {
    enum State {
        case loading
        case error(String)
        case ready([ExerciseCard])
    }

    var state: State = .loading
    var formError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: ExercisesResponse = try await api.get("/api/exercises")
            state = .ready(res.exercises)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// true = сохранено (закрыть форму). id == nil — создание.
    func save(api: APIClient, id: String?, request: ExerciseUpsertRequest) async -> Bool {
        do {
            if let id {
                let _: ExerciseResponse = try await api.patch("/api/exercises/\(id)", body: request)
            } else {
                let _: ExerciseResponse = try await api.post("/api/exercises", body: request)
            }
            formError = nil
            await load(api: api)
            return true
        } catch {
            formError = error.localizedDescription
            return false
        }
    }

    func delete(api: APIClient, id: String) async {
        let _: OkResponse? = try? await api.delete("/api/exercises/\(id)", body: EmptyBody())
        await load(api: api)
    }
}

/// Обёртка для sheet(item:): exercise == nil — создание нового.
private struct ExerciseFormTarget: Identifiable {
    let id = UUID()
    var exercise: ExerciseCard?
}

struct StudioExercisesSection: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = StudioExercisesModel()
    @State private var formTarget: ExerciseFormTarget?

    var body: some View {
        Group {
            switch model.state {
            case .loading:
                Spacer()
                ProgressView().tint(FPTheme.primary)
                Spacer()
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api) }
                }
                Spacer()
            case .ready(let exercises):
                if exercises.isEmpty {
                    EmptyStateView(
                        title: "Библиотека пуста",
                        subtitle: "Добавьте первое упражнение — оно пригодится в шаблонах"
                    )
                    Spacer()
                } else {
                    List(exercises) { exercise in
                        Button {
                            formTarget = ExerciseFormTarget(exercise: exercise)
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(exercise.name).foregroundStyle(FPTheme.foreground)
                                if let muscles = exercise.muscles, !muscles.isEmpty {
                                    Text(muscles)
                                        .font(.footnote)
                                        .foregroundStyle(FPTheme.mutedForeground)
                                }
                            }
                        }
                        .listRowBackground(FPTheme.card)
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await model.delete(api: auth.api, id: exercise.id) }
                            } label: {
                                Label("Удалить", systemImage: "trash")
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    formTarget = ExerciseFormTarget(exercise: nil)
                } label: {
                    Image(systemName: "plus")
                }
                .tint(FPTheme.primary)
            }
        }
        .task { await model.load(api: auth.api) }
        .sheet(item: $formTarget) { target in
            ExerciseFormSheet(exercise: target.exercise, errorText: model.formError) { request in
                Task {
                    if await model.save(api: auth.api, id: target.exercise?.id, request: request) {
                        formTarget = nil
                    }
                }
            }
        }
    }
}

struct ExerciseFormSheet: View {
    let exercise: ExerciseCard? // nil = создание
    let errorText: String?
    let onSave: (ExerciseUpsertRequest) -> Void

    @State private var name: String
    @State private var videoUrl: String
    @State private var technique: String
    @State private var hints: String
    @State private var mistakes: String
    @State private var muscles: String

    init(exercise: ExerciseCard?, errorText: String?, onSave: @escaping (ExerciseUpsertRequest) -> Void) {
        self.exercise = exercise
        self.errorText = errorText
        self.onSave = onSave
        _name = State(initialValue: exercise?.name ?? "")
        _videoUrl = State(initialValue: exercise?.videoUrl ?? "")
        _technique = State(initialValue: exercise?.techniqueDescription ?? "")
        _hints = State(initialValue: exercise?.keyHints ?? "")
        _mistakes = State(initialValue: exercise?.commonMistakes ?? "")
        _muscles = State(initialValue: exercise?.muscles ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                TextField("Название*", text: $name)
                TextField("Ссылка на видео", text: $videoUrl)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                TextField("Техника выполнения", text: $technique, axis: .vertical)
                    .lineLimit(2...5)
                TextField("Ключевые подсказки", text: $hints, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Частые ошибки", text: $mistakes, axis: .vertical)
                    .lineLimit(2...4)
                TextField("Мышечные группы", text: $muscles)
                if let errorText {
                    Text(errorText).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                }
            }
            .navigationTitle(exercise == nil ? "Новое упражнение" : "Упражнение")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") {
                        onSave(
                            ExerciseUpsertRequest(
                                name: name.trimmingCharacters(in: .whitespaces),
                                videoUrl: videoUrl.isEmpty ? nil : videoUrl,
                                techniqueDescription: technique.isEmpty ? nil : technique,
                                keyHints: hints.isEmpty ? nil : hints,
                                commonMistakes: mistakes.isEmpty ? nil : mistakes,
                                muscles: muscles.isEmpty ? nil : muscles
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

/* =============================== Шаблоны ================================ */

enum TemplateRoute: Hashable {
    case new
    case edit(String)
}

@MainActor
@Observable
final class StudioTemplatesModel {
    enum State {
        case loading
        case error(String)
        case ready([WorkoutTemplateCard])
    }

    var state: State = .loading
    var formError: String?
    var busy = false

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: TemplatesResponse = try await api.get("/api/templates")
            state = .ready(res.templates)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// true = сохранено (закрыть редактор). id == nil — создание.
    func save(api: APIClient, id: String?, request: TemplateUpsertRequest) async -> Bool {
        busy = true
        defer { busy = false }
        do {
            if let id {
                let _: OkResponse = try await api.put("/api/templates/\(id)", body: request)
            } else {
                let _: TemplateResponse = try await api.post("/api/templates", body: request)
            }
            formError = nil
            await load(api: api)
            return true
        } catch {
            formError = error.localizedDescription
            return false
        }
    }

    func delete(api: APIClient, id: String) async {
        let _: OkResponse? = try? await api.delete("/api/templates/\(id)", body: EmptyBody())
        await load(api: api)
    }
}

struct StudioTemplatesSection: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = StudioTemplatesModel()

    var body: some View {
        Group {
            switch model.state {
            case .loading:
                Spacer()
                ProgressView().tint(FPTheme.primary)
                Spacer()
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api) }
                }
                Spacer()
            case .ready(let templates):
                if templates.isEmpty {
                    EmptyStateView(
                        title: "Шаблонов пока нет",
                        subtitle: "Соберите программу один раз — назначайте в пару касаний"
                    )
                    Spacer()
                } else {
                    List(templates) { template in
                        NavigationLink(value: TemplateRoute.edit(template.id)) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(template.name).foregroundStyle(FPTheme.foreground)
                                if let goal = template.goal, !goal.isEmpty {
                                    Text(goal)
                                        .font(.footnote)
                                        .foregroundStyle(FPTheme.mutedForeground)
                                }
                            }
                        }
                        .listRowBackground(FPTheme.card)
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await model.delete(api: auth.api, id: template.id) }
                            } label: {
                                Label("Удалить", systemImage: "trash")
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                NavigationLink(value: TemplateRoute.new) {
                    Image(systemName: "plus")
                }
                .tint(FPTheme.primary)
            }
        }
        .navigationDestination(for: TemplateRoute.self) { route in
            TemplateEditorView(route: route, model: model)
        }
        .task { await model.load(api: auth.api) }
    }
}

struct TemplateEditorView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss
    let route: TemplateRoute
    let model: StudioTemplatesModel

    @State private var name = ""
    @State private var goal = ""
    @State private var rows: [WorkoutDraftRow] = []
    @State private var loaded = false
    @State private var loadError: String?

    private var templateId: String? {
        if case .edit(let id) = route { return id }
        return nil
    }

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            if loaded {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        TextField("Название шаблона*", text: $name)
                            .textFieldStyle(.roundedBorder)
                        TextField("Цель (например, «набор массы»)", text: $goal)
                            .textFieldStyle(.roundedBorder)

                        sectionTitle("Упражнения")
                        WorkoutDraftRowsEditor(rows: $rows)

                        if let message = loadError ?? model.formError {
                            Text(message).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                        }

                        Button {
                            Task { await save() }
                        } label: {
                            Text("Сохранить шаблон")
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                        }
                        .background(FPTheme.primary)
                        .foregroundStyle(FPTheme.primaryForeground)
                        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || model.busy)
                    }
                    .padding(16)
                }
            } else {
                ProgressView().tint(FPTheme.primary)
            }
        }
        .navigationTitle(templateId == nil ? "Новый шаблон" : "Шаблон")
        .task { await loadDetail() }
    }

    private func loadDetail() async {
        guard !loaded else { return }
        defer { loaded = true }
        guard let templateId else { return }
        do {
            // Имена упражнений в строках шаблона — из библиотеки.
            let library: ExercisesResponse = try await auth.api.get("/api/exercises")
            let names = Dictionary(uniqueKeysWithValues: library.exercises.map { ($0.id, $0.name) })
            let detail: TemplateDetailResponse = try await auth.api.get("/api/templates/\(templateId)")
            name = detail.template.name
            goal = detail.template.goal ?? ""
            rows = detail.items.sorted { $0.order < $1.order }.map { item in
                WorkoutDraftRow(
                    exerciseId: item.exerciseId,
                    exerciseName: names[item.exerciseId] ?? "Упражнение",
                    sets: item.sets.map(String.init) ?? "",
                    reps: item.reps ?? "",
                    weight: item.weight ?? "",
                    rest: item.rest ?? "",
                    groupKey: item.groupKey ?? ""
                )
            }
        } catch {
            loadError = error.localizedDescription
        }
    }

    private func save() async {
        let request = TemplateUpsertRequest(
            name: name.trimmingCharacters(in: .whitespaces),
            goal: goal.isEmpty ? nil : goal,
            items: rows.enumerated().map { index, row in row.draft(order: index) }
        )
        if await model.save(api: auth.api, id: templateId, request: request) {
            dismiss()
        }
    }
}

/* ---------------- Общий конструктор строк упражнений ---------------- */

/// Локальная редактируемая строка конструктора (шаблон и ручное назначение).
struct WorkoutDraftRow: Identifiable {
    let id = UUID()
    var exerciseId: String
    var exerciseName: String
    var sets = ""
    var reps = ""
    var weight = ""
    var rest = ""
    var groupKey = ""

    /// order проставляется индексом строки при сохранении.
    func draft(order: Int) -> WorkoutItemDraft {
        WorkoutItemDraft(
            exerciseId: exerciseId,
            order: order,
            sets: Int(sets),
            reps: reps.isEmpty ? nil : reps,
            weight: weight.isEmpty ? nil : weight,
            rest: rest.isEmpty ? nil : rest,
            groupKey: groupKey.isEmpty ? nil : groupKey,
            groupType: groupKey.isEmpty ? nil : "superset"
        )
    }
}

struct WorkoutDraftRowsEditor: View {
    @Binding var rows: [WorkoutDraftRow]
    @State private var showPicker = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach($rows) { $row in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(row.exerciseName)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(FPTheme.foreground)
                        Spacer()
                        Button {
                            rows.removeAll { $0.id == row.id }
                        } label: {
                            Image(systemName: "trash")
                                .foregroundStyle(FPTheme.destructiveSoft)
                        }
                    }
                    HStack(spacing: 8) {
                        TextField("Подходы", text: $row.sets).keyboardType(.numberPad)
                        TextField("Повторы", text: $row.reps)
                        TextField("Вес", text: $row.weight)
                    }
                    .textFieldStyle(.roundedBorder)
                    HStack(spacing: 8) {
                        TextField("Отдых", text: $row.rest)
                        TextField("Группа (суперсет)", text: $row.groupKey)
                    }
                    .textFieldStyle(.roundedBorder)
                }
                .padding(12)
                .background(FPTheme.card)
                .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
            }

            Button {
                showPicker = true
            } label: {
                Label("Добавить упражнение", systemImage: "plus")
            }
            .foregroundStyle(FPTheme.primary)
        }
        .sheet(isPresented: $showPicker) {
            ExercisePickerSheet { exercise in
                rows.append(WorkoutDraftRow(exerciseId: exercise.id, exerciseName: exercise.name))
                showPicker = false
            }
        }
    }
}

struct ExercisePickerSheet: View {
    @Environment(AuthStore.self) private var auth
    let onPick: (ExerciseCard) -> Void

    @State private var exercises: [ExerciseCard]?
    @State private var loadError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                if let exercises {
                    if exercises.isEmpty {
                        EmptyStateView(
                            title: "Библиотека пуста",
                            subtitle: "Сначала добавьте упражнения в разделе «Упражнения»"
                        )
                    } else {
                        List(exercises) { exercise in
                            Button {
                                onPick(exercise)
                            } label: {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(exercise.name).foregroundStyle(FPTheme.foreground)
                                    if let muscles = exercise.muscles, !muscles.isEmpty {
                                        Text(muscles)
                                            .font(.footnote)
                                            .foregroundStyle(FPTheme.mutedForeground)
                                    }
                                }
                            }
                            .listRowBackground(FPTheme.card)
                        }
                        .scrollContentBackground(.hidden)
                    }
                } else if let loadError {
                    ErrorRetryView(message: loadError) {
                        Task { await load() }
                    }
                } else {
                    ProgressView().tint(FPTheme.primary)
                }
            }
            .navigationTitle("Выбор упражнения")
        }
        .task { await load() }
        .presentationDetents([.large])
    }

    private func load() async {
        loadError = nil
        do {
            let res: ExercisesResponse = try await auth.api.get("/api/exercises")
            exercises = res.exercises
        } catch {
            loadError = error.localizedDescription
        }
    }
}

/* =============================== Привычки =============================== */

@MainActor
@Observable
final class StudioHabitsModel {
    enum State {
        case loading
        case error(String)
        case ready([HabitTask])
    }

    var state: State = .loading
    var actionError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: HabitsResponse = try await api.get("/api/tasks/habits")
            state = .ready(res.habits)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func create(api: APIClient, title: String) async {
        do {
            let _: HabitResponse = try await api.post("/api/tasks/habits", body: HabitRequest(title: title))
            actionError = nil
            await load(api: api)
        } catch {
            actionError = error.localizedDescription
        }
    }

    func delete(api: APIClient, id: String) async {
        let _: OkResponse? = try? await api.delete("/api/tasks/habits/\(id)", body: EmptyBody())
        await load(api: api)
    }

    /// true = назначено (закрыть выбор клиента).
    func assign(api: APIClient, clientId: String, habitTaskId: String) async -> Bool {
        do {
            let _: OkResponse = try await api.post(
                "/api/tasks/assign",
                body: AssignHabitRequest(clientId: clientId, habitTaskId: habitTaskId)
            )
            actionError = nil
            return true
        } catch {
            actionError = error.localizedDescription
            return false
        }
    }
}

struct StudioHabitsSection: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = StudioHabitsModel()
    @State private var showCreateAlert = false
    @State private var newTitle = ""
    @State private var assignTarget: HabitTask?

    var body: some View {
        Group {
            switch model.state {
            case .loading:
                Spacer()
                ProgressView().tint(FPTheme.primary)
                Spacer()
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api) }
                }
                Spacer()
            case .ready(let habits):
                if habits.isEmpty {
                    EmptyStateView(
                        title: "Привычек пока нет",
                        subtitle: "Создайте привычку и назначайте её клиентам на неделю"
                    )
                    Spacer()
                } else {
                    List(habits) { habit in
                        HStack {
                            Text(habit.title).foregroundStyle(FPTheme.foreground)
                            Spacer()
                            Button("Назначить") {
                                assignTarget = habit
                            }
                            .font(.caption.weight(.medium))
                            .buttonStyle(.bordered)
                            .tint(FPTheme.primary)
                        }
                        .listRowBackground(FPTheme.card)
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await model.delete(api: auth.api, id: habit.id) }
                            } label: {
                                Label("Удалить", systemImage: "trash")
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            if let message = model.actionError {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(FPTheme.destructiveSoft)
                    .padding(.horizontal, 16)
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    newTitle = ""
                    showCreateAlert = true
                } label: {
                    Image(systemName: "plus")
                }
                .tint(FPTheme.primary)
            }
        }
        .task { await model.load(api: auth.api) }
        .alert("Новая привычка", isPresented: $showCreateAlert) {
            TextField("Например, «10 000 шагов»", text: $newTitle)
            Button("Создать") {
                let title = newTitle.trimmingCharacters(in: .whitespaces)
                if !title.isEmpty {
                    Task { await model.create(api: auth.api, title: title) }
                }
            }
            Button("Отмена", role: .cancel) {}
        }
        .sheet(item: $assignTarget) { habit in
            ClientPickerSheet(subtitle: "Кому назначить «\(habit.title)»") { client in
                Task {
                    if await model.assign(api: auth.api, clientId: client.id, habitTaskId: habit.id) {
                        assignTarget = nil
                    }
                }
            }
        }
    }
}

/// Выбор клиента из списка тренера (привычки, оплаты и т.п.).
struct ClientPickerSheet: View {
    @Environment(AuthStore.self) private var auth
    let subtitle: String
    let onPick: (TrainerClientCard) -> Void

    @State private var clients: [TrainerClientCard]?
    @State private var loadError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                if let clients {
                    if clients.isEmpty {
                        EmptyStateView(title: "Клиентов нет", subtitle: "Сначала добавьте клиента")
                    } else {
                        List {
                            Text(subtitle)
                                .font(.footnote)
                                .foregroundStyle(FPTheme.mutedForeground)
                                .listRowBackground(Color.clear)
                            ForEach(clients) { client in
                                Button {
                                    onPick(client)
                                } label: {
                                    Text(client.name).foregroundStyle(FPTheme.foreground)
                                }
                                .listRowBackground(FPTheme.card)
                            }
                        }
                        .scrollContentBackground(.hidden)
                    }
                } else if let loadError {
                    ErrorRetryView(message: loadError) {
                        Task { await load() }
                    }
                } else {
                    ProgressView().tint(FPTheme.primary)
                }
            }
            .navigationTitle("Выбор клиента")
        }
        .task { await load() }
        .presentationDetents([.large])
    }

    private func load() async {
        loadError = nil
        do {
            let res: TrainerClientsResponse = try await auth.api.get("/api/clients")
            clients = res.clients
        } catch {
            loadError = error.localizedDescription
        }
    }
}

/* =============================== Материалы ============================== */

/// Русские названия категорий/типов материалов (дублируют KnowledgeView — там private).
private let knowledgeCategoryLabels = [
    "nutrition": "Питание", "training": "Тренинг",
    "measurements": "Замеры", "recovery": "Восстановление",
]
private let knowledgeTypeLabels = ["pdf": "PDF", "video": "Видео", "checklist": "Чек-лист"]

@MainActor
@Observable
final class StudioKnowledgeModel {
    enum State {
        case loading
        case error(String)
        case ready([KnowledgeItem])
    }

    var state: State = .loading
    var formError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: KnowledgeAdminResponse = try await api.get("/api/knowledge")
            state = .ready(res.items)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// true = сохранено (закрыть форму).
    func create(api: APIClient, request: KnowledgeCreateRequest) async -> Bool {
        do {
            let _: KnowledgeItemResponse = try await api.post("/api/knowledge", body: request)
            formError = nil
            await load(api: api)
            return true
        } catch {
            formError = error.localizedDescription
            return false
        }
    }

    func delete(api: APIClient, id: String) async {
        let _: OkResponse? = try? await api.delete("/api/knowledge/\(id)", body: EmptyBody())
        await load(api: api)
    }
}

struct StudioKnowledgeSection: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = StudioKnowledgeModel()
    @State private var showAdd = false

    var body: some View {
        Group {
            switch model.state {
            case .loading:
                Spacer()
                ProgressView().tint(FPTheme.primary)
                Spacer()
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api) }
                }
                Spacer()
            case .ready(let items):
                if items.isEmpty {
                    EmptyStateView(
                        title: "Материалов пока нет",
                        subtitle: "Добавьте гайды и чек-листы — клиенты получат их по неделям"
                    )
                    Spacer()
                } else {
                    List(items) { item in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(
                                "\(knowledgeCategoryLabels[item.category] ?? item.category)"
                                    + " · \(knowledgeTypeLabels[item.type] ?? item.type)"
                                    + " · неделя \(item.unlockWeek)"
                            )
                            .font(.caption2)
                            .foregroundStyle(FPTheme.mutedForeground)
                            Text(item.title).foregroundStyle(FPTheme.foreground)
                        }
                        .listRowBackground(FPTheme.card)
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await model.delete(api: auth.api, id: item.id) }
                            } label: {
                                Label("Удалить", systemImage: "trash")
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showAdd = true
                } label: {
                    Image(systemName: "plus")
                }
                .tint(FPTheme.primary)
            }
        }
        .task { await model.load(api: auth.api) }
        .sheet(isPresented: $showAdd) {
            KnowledgeFormSheet(errorText: model.formError) { request in
                Task {
                    if await model.create(api: auth.api, request: request) {
                        showAdd = false
                    }
                }
            }
        }
    }
}

struct KnowledgeFormSheet: View {
    @Environment(AuthStore.self) private var auth
    let errorText: String?
    let onSave: (KnowledgeCreateRequest) -> Void

    @State private var title = ""
    @State private var category = "nutrition"
    @State private var type = "pdf"
    @State private var unlockWeek = 1
    @State private var fileUrl: String?
    @State private var showImporter = false
    @State private var uploading = false
    @State private var uploadError: String?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Название*", text: $title)
                Picker("Категория", selection: $category) {
                    Text("Питание").tag("nutrition")
                    Text("Тренинг").tag("training")
                    Text("Замеры").tag("measurements")
                    Text("Восстановление").tag("recovery")
                }
                .pickerStyle(.segmented)
                Picker("Тип", selection: $type) {
                    Text("PDF").tag("pdf")
                    Text("Видео").tag("video")
                    Text("Чек-лист").tag("checklist")
                }
                .pickerStyle(.segmented)
                Stepper("Открыть с недели: \(unlockWeek)", value: $unlockWeek, in: 1...52)
                Section("Файл") {
                    Button {
                        showImporter = true
                    } label: {
                        Label(
                            fileUrl != nil ? "Файл прикреплён ✓" : "Прикрепить файл",
                            systemImage: "paperclip"
                        )
                    }
                    if uploading { ProgressView() }
                }
                if let message = errorText ?? uploadError {
                    Text(message).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                }
            }
            .navigationTitle("Новый материал")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") {
                        onSave(
                            KnowledgeCreateRequest(
                                category: category,
                                title: title.trimmingCharacters(in: .whitespaces),
                                type: type,
                                fileUrl: fileUrl,
                                unlockWeek: unlockWeek
                            )
                        )
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || uploading)
                }
            }
            .fileImporter(
                isPresented: $showImporter,
                allowedContentTypes: [.pdf, .movie, .image]
            ) { result in
                if case .success(let url) = result {
                    upload(url)
                }
            }
        }
        .presentationDetents([.large])
    }

    private func upload(_ url: URL) {
        uploading = true
        Task {
            defer { uploading = false }
            do {
                // Файл вне песочницы приложения — нужен security-scoped доступ.
                let accessing = url.startAccessingSecurityScopedResource()
                defer { if accessing { url.stopAccessingSecurityScopedResource() } }
                let data = try Data(contentsOf: url)
                fileUrl = try await auth.api.uploadFile(
                    data: data,
                    filename: url.lastPathComponent,
                    mime: mimeType(for: url)
                )
                uploadError = nil
            } catch {
                uploadError = error.localizedDescription
            }
        }
    }

    private func mimeType(for url: URL) -> String {
        if let type = UTType(filenameExtension: url.pathExtension),
           let mime = type.preferredMIMEType {
            return mime
        }
        return "application/octet-stream"
    }
}

/* ============================ Формы отчётов ============================= */

@MainActor
@Observable
final class StudioFormsModel {
    enum State {
        case loading
        case error(String)
        case ready([ReportFormWithFields])
    }

    var state: State = .loading
    var formError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: ReportFormsResponse = try await api.get("/api/reports/forms")
            state = .ready(res.forms)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// true = сохранено (закрыть форму).
    func create(api: APIClient, request: ReportFormCreateRequest) async -> Bool {
        do {
            let _: ReportFormOnlyResponse = try await api.post("/api/reports/forms", body: request)
            formError = nil
            await load(api: api)
            return true
        } catch {
            formError = error.localizedDescription
            return false
        }
    }

    func delete(api: APIClient, id: String) async {
        let _: OkResponse? = try? await api.delete("/api/reports/forms/\(id)", body: EmptyBody())
        await load(api: api)
    }
}

struct StudioFormsSection: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = StudioFormsModel()
    @State private var showCreate = false

    var body: some View {
        Group {
            switch model.state {
            case .loading:
                Spacer()
                ProgressView().tint(FPTheme.primary)
                Spacer()
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api) }
                }
                Spacer()
            case .ready(let forms):
                if forms.isEmpty {
                    EmptyStateView(
                        title: "Форм отчёта пока нет",
                        subtitle: "Соберите еженедельный отчёт из нужных полей"
                    )
                    Spacer()
                } else {
                    List(forms) { form in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(form.name).foregroundStyle(FPTheme.foreground)
                            Text("Полей: \(form.fields.count)")
                                .font(.footnote)
                                .foregroundStyle(FPTheme.mutedForeground)
                        }
                        .listRowBackground(FPTheme.card)
                        .swipeActions {
                            Button(role: .destructive) {
                                Task { await model.delete(api: auth.api, id: form.id) }
                            } label: {
                                Label("Удалить", systemImage: "trash")
                            }
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showCreate = true
                } label: {
                    Image(systemName: "plus")
                }
                .tint(FPTheme.primary)
            }
        }
        .task { await model.load(api: auth.api) }
        .sheet(isPresented: $showCreate) {
            ReportFormBuilderSheet(errorText: model.formError) { request in
                Task {
                    if await model.create(api: auth.api, request: request) {
                        showCreate = false
                    }
                }
            }
        }
    }
}

struct ReportFormBuilderSheet: View {
    let errorText: String?
    let onSave: (ReportFormCreateRequest) -> Void

    /// Черновик поля формы (id — только для ForEach).
    struct FieldDraft: Identifiable {
        let id = UUID()
        var label = ""
        var type = "number"
    }

    @State private var name = ""
    @State private var fields: [FieldDraft] = [FieldDraft()]

    var body: some View {
        NavigationStack {
            Form {
                TextField("Название формы*", text: $name)
                Section("Поля") {
                    ForEach($fields) { $field in
                        VStack(alignment: .leading, spacing: 6) {
                            TextField("Вопрос клиенту", text: $field.label)
                            Picker("Тип", selection: $field.type) {
                                Text("Число").tag("number")
                                Text("Текст").tag("text")
                                Text("Фото").tag("photo")
                                Text("Выбор").tag("select")
                            }
                            .pickerStyle(.segmented)
                        }
                    }
                    .onDelete { offsets in
                        fields.remove(atOffsets: offsets)
                    }
                    Button {
                        fields.append(FieldDraft())
                    } label: {
                        Label("Добавить поле", systemImage: "plus")
                    }
                }
                if let errorText {
                    Text(errorText).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                }
            }
            .navigationTitle("Новая форма")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") {
                        let prepared = fields
                            .filter { !$0.label.trimmingCharacters(in: .whitespaces).isEmpty }
                            .enumerated()
                            .map { index, field in
                                NewReportField(label: field.label, type: field.type, order: index)
                            }
                        onSave(ReportFormCreateRequest(name: name.trimmingCharacters(in: .whitespaces), fields: prepared))
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .presentationDetents([.large])
    }
}
