import SwiftUI

@MainActor
@Observable
final class WorkoutDetailModel {
    enum State {
        case loading
        case error(String)
        case ready(WorkoutDetailResponse)
    }

    var state: State = .loading
    var message: String?
    private var workoutId = ""

    func load(api: APIClient, id: String) async {
        workoutId = id
        state = .loading
        do {
            let res: WorkoutDetailResponse = try await api.get("/api/workouts/\(id)")
            state = .ready(res)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// Отметить подход (upsert на сервере) и обновить логи локально.
    func logSet(api: APIClient, item: WorkoutItem, setNumber: Int, weight: Double?, reps: Int?) async {
        do {
            let res: LogSetResponse = try await api.post(
                "/api/workouts/\(workoutId)/log",
                body: LogSetRequest(
                    workoutExerciseId: item.id, setNumber: setNumber, weight: weight, reps: reps
                )
            )
            mutateLogs(itemId: item.id) { logs in
                logs.filter { $0.setNumber != setNumber } + [res.log]
            }
        } catch {
            message = error.localizedDescription
        }
    }

    func removeSet(api: APIClient, item: WorkoutItem, setNumber: Int) async {
        do {
            let _: OkResponse = try await api.delete(
                "/api/workouts/\(workoutId)/log",
                body: DeleteLogRequest(workoutExerciseId: item.id, setNumber: setNumber)
            )
            mutateLogs(itemId: item.id) { logs in
                logs.filter { $0.setNumber != setNumber }
            }
        } catch {
            message = error.localizedDescription
        }
    }

    func complete(api: APIClient, feeling: String?, comment: String?) async {
        do {
            let res: WorkoutStatusResponse = try await api.patch(
                "/api/workouts/\(workoutId)/status",
                body: WorkoutStatusRequest(
                    status: "completed",
                    feeling: feeling,
                    comment: (comment?.isEmpty == false) ? comment : nil
                )
            )
            if case .ready(var detail) = state {
                detail.workout = res.workout
                state = .ready(detail)
            }
            if !res.earnedAchievements.isEmpty {
                message = "Достижение: \(res.earnedAchievements.joined(separator: ", "))"
            }
        } catch {
            message = error.localizedDescription
        }
    }

    private func mutateLogs(itemId: String, _ transform: ([SetLog]) -> [SetLog]) {
        guard case .ready(var detail) = state else { return }
        detail.items = detail.items.map { item in
            guard item.id == itemId else { return item }
            var updated = item
            updated.logs = transform(item.logs).sorted { $0.setNumber < $1.setNumber }
            return updated
        }
        state = .ready(detail)
    }
}

struct WorkoutDetailView: View {
    @Environment(AuthStore.self) private var auth
    let workoutId: String
    let onChanged: () -> Void

    @State private var model = WorkoutDetailModel()
    @State private var showComplete = false

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            switch model.state {
            case .loading:
                ProgressView().tint(FPTheme.primary)
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api, id: workoutId) }
                }
            case .ready(let detail):
                detailList(detail)
            }
        }
        .navigationTitle("Тренировка")
        .task { await model.load(api: auth.api, id: workoutId) }
        .sheet(isPresented: $showComplete) {
            CompleteWorkoutSheet { feeling, comment in
                showComplete = false
                Task {
                    await model.complete(api: auth.api, feeling: feeling, comment: comment)
                    onChanged()
                }
            }
        }
    }

    @ViewBuilder
    private func detailList(_ detail: WorkoutDetailResponse) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(detail.workout.title ?? "Тренировка")
                            .font(FPTheme.Typography.pageTitle())
                            .foregroundStyle(FPTheme.foreground)
                        Text(formatDate(detail.workout.date))
                            .font(.footnote)
                            .foregroundStyle(FPTheme.mutedForeground)
                    }
                    Spacer()
                    StatusChip(status: detail.workout.status)
                }
                if let trainerComment = detail.workout.trainerComment {
                    Text("Тренер: \(trainerComment)")
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                }

                ForEach(detail.items.sorted { $0.order < $1.order }) { item in
                    ExerciseCardView(
                        item: item,
                        editable: detail.workout.status == "assigned",
                        onLog: { setNumber, weight, reps in
                            Task {
                                await model.logSet(
                                    api: auth.api, item: item,
                                    setNumber: setNumber, weight: weight, reps: reps
                                )
                            }
                        },
                        onRemove: { setNumber in
                            Task {
                                await model.removeSet(api: auth.api, item: item, setNumber: setNumber)
                            }
                        }
                    )
                }

                if detail.workout.status == "assigned" {
                    Button {
                        showComplete = true
                    } label: {
                        Text("Завершить тренировку")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .background(FPTheme.primary)
                    .foregroundStyle(FPTheme.primaryForeground)
                    .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                }

                if let message = model.message {
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                }
            }
            .padding(16)
        }
    }
}

/// «90 сек» / «2 мин» → секунды; нераспознанное = нет таймера.
func parseRestSeconds(_ rest: String?) -> Int? {
    guard let rest,
          let match = rest.ranges(of: /\d+([.,]\d+)?/).first,
          let value = Double(rest[match].replacingOccurrences(of: ",", with: "."))
    else { return nil }
    let minutes = rest.localizedCaseInsensitiveContains("мин")
        || rest.localizedCaseInsensitiveContains("min")
    return min(max(Int(minutes ? value * 60 : value), 5), 3600)
}

struct ExerciseCardView: View {
    let item: WorkoutItem
    let editable: Bool
    let onLog: (Int, Double?, Int?) -> Void
    let onRemove: (Int) -> Void

    // Таймер отдыха: свой на упражнение, стартует после отметки подхода.
    @State private var restLeft = 0
    @State private var timerTask: Task<Void, Never>?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let groupKey = item.groupKey {
                Text(groupLabel(groupKey))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(FPTheme.primary)
            }
            Text(item.exercise.name)
                .font(.headline)
                .foregroundStyle(FPTheme.foreground)
            let plan = [
                item.sets.map { "\($0) подх." },
                item.reps.map { "\($0) повт." },
                item.weight,
                item.rest.map { "отдых \($0)" },
            ].compactMap { $0 }.joined(separator: " · ")
            if !plan.isEmpty {
                Text(plan).font(.footnote).foregroundStyle(FPTheme.mutedForeground)
            }
            if let comment = item.comment {
                Text(comment).font(.footnote).foregroundStyle(FPTheme.mutedForeground)
            }

            if restLeft > 0 {
                HStack(spacing: 12) {
                    Text(String(format: "Отдых: %d:%02d", restLeft / 60, restLeft % 60))
                        .font(.headline)
                        .foregroundStyle(FPTheme.primary)
                    Button("Пропустить") { stopTimer() }
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                }
            }

            let setCount = max(item.sets ?? 0, item.logs.map(\.setNumber).max() ?? 0, 1)
            ForEach(1...setCount, id: \.self) { setNumber in
                SetRowView(
                    item: item,
                    setNumber: setNumber,
                    log: item.logs.first { $0.setNumber == setNumber },
                    editable: editable,
                    onLog: { set, weight, reps in
                        onLog(set, weight, reps)
                        startTimer()
                    },
                    onRemove: onRemove
                )
            }
        }
        .onDisappear { stopTimer() }
        .padding(16)
        .background(FPTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
        .overlay(
            RoundedRectangle(cornerRadius: FPTheme.Radius.control)
                .stroke(FPTheme.border, lineWidth: 1)
        )
    }

    private func groupLabel(_ key: String) -> String {
        switch item.groupType {
        case "triset": "Трисет \(key)"
        case "circuit": "Круг \(key)"
        default: "Суперсет \(key)"
        }
    }

    private func startTimer() {
        guard let seconds = parseRestSeconds(item.rest) else { return }
        stopTimer()
        restLeft = seconds
        timerTask = Task {
            while !Task.isCancelled, restLeft > 0 {
                try? await Task.sleep(for: .seconds(1))
                restLeft -= 1
            }
        }
    }

    private func stopTimer() {
        timerTask?.cancel()
        timerTask = nil
        restLeft = 0
    }
}

struct SetRowView: View {
    let item: WorkoutItem
    let setNumber: Int
    let log: SetLog?
    let editable: Bool
    let onLog: (Int, Double?, Int?) -> Void
    let onRemove: (Int) -> Void

    @State private var weight = ""
    @State private var reps = ""

    private var done: Bool { log != nil }

    var body: some View {
        HStack(spacing: 8) {
            Text("\(setNumber)")
                .font(.caption)
                .foregroundStyle(FPTheme.mutedForeground)
                .frame(width: 18)
            TextField("Вес", text: $weight)
                .keyboardType(.decimalPad)
                .disabled(!editable || done)
            TextField("Повт.", text: $reps)
                .keyboardType(.numberPad)
                .disabled(!editable || done)
            Button {
                if done {
                    onRemove(setNumber)
                } else {
                    onLog(
                        setNumber,
                        Double(weight.replacingOccurrences(of: ",", with: ".")),
                        Int(reps)
                    )
                }
            } label: {
                Image(systemName: done ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(done ? FPTheme.success : FPTheme.mutedForeground)
            }
            .disabled(!editable)
        }
        .textFieldStyle(.roundedBorder)
        .onAppear {
            if let log {
                weight = log.weight.map(formatNumber) ?? ""
                reps = log.reps.map(String.init) ?? ""
            }
        }
    }
}

func formatNumber(_ value: Double) -> String {
    value.truncatingRemainder(dividingBy: 1) == 0
        ? String(Int(value))
        : String(value)
}

struct CompleteWorkoutSheet: View {
    let onConfirm: (String?, String?) -> Void

    @State private var feeling: String?
    @State private var comment = ""

    private let feelings: [(String, String)] = [
        ("easy", "Легко"), ("moderate", "Нормально"),
        ("hard", "Тяжело"), ("very_hard", "Очень тяжело"),
    ]

    var body: some View {
        NavigationStack {
            Form {
                Section("Как прошла тренировка?") {
                    ForEach(feelings, id: \.0) { value, label in
                        Button {
                            feeling = feeling == value ? nil : value
                        } label: {
                            HStack {
                                Text(label).foregroundStyle(FPTheme.foreground)
                                Spacer()
                                if feeling == value {
                                    Image(systemName: "checkmark").foregroundStyle(FPTheme.primary)
                                }
                            }
                        }
                    }
                }
                Section("Комментарий тренеру") {
                    TextField("Необязательно", text: $comment, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle("Завершить")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Завершить") { onConfirm(feeling, comment) }
                }
            }
        }
        .presentationDetents([.medium])
    }
}
