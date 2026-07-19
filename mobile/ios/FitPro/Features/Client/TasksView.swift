import SwiftUI

@MainActor
@Observable
final class TasksModel {
    enum State {
        case loading
        case error(String)
        case ready(TasksResponse)
    }

    var state: State = .loading

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: TasksResponse = try await api.get("/api/tasks/mine")
            state = .ready(res)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// Оптимистичное обновление; при ошибке перечитываем неделю.
    func toggle(api: APIClient, task: WeekTask, date: String, done: Bool) async {
        guard case .ready(var week) = state else { return }
        week.tasks = week.tasks.map { t in
            guard t.id == task.id else { return t }
            var updated = t
            updated.doneDays = done
                ? Array(Set(t.doneDays + [date]))
                : t.doneDays.filter { $0 != date }
            updated.compliance = Int(Double(updated.doneDays.count) * 100.0 / 7.0)
            return updated
        }
        state = .ready(week)
        do {
            let _: OkResponse = try await api.post(
                "/api/tasks/\(task.id)/toggle",
                body: ToggleTaskRequest(date: date, done: done)
            )
        } catch {
            await load(api: api)
        }
    }
}

/// Неделя клиента: сегменты «Привычки» и «Отчёт».
struct TasksView: View {
    @State private var segment = 0

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                VStack(spacing: 12) {
                    Picker("Раздел", selection: $segment) {
                        Text("Привычки").tag(0)
                        Text("Отчёт").tag(1)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                    if segment == 0 {
                        HabitsSectionView()
                    } else {
                        ReportSectionView()
                    }
                }
                // Без этого VStack центрируется в ZStack и сегменты уезжают в середину.
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
            .navigationTitle("Задачи недели")
        }
    }
}

struct HabitsSectionView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = TasksModel()

    private let dayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

    var body: some View {
        Group {
                switch model.state {
                case .loading:
                    ProgressView().tint(FPTheme.primary)
                case .error(let message):
                    ErrorRetryView(message: message) {
                        Task { await model.load(api: auth.api) }
                    }
                case .ready(let week):
                    if week.tasks.isEmpty {
                        EmptyStateView(
                            title: "Задач на неделю нет",
                            subtitle: "Тренер назначит привычки — отмечайте их здесь"
                        )
                    } else {
                        taskList(week)
                    }
                }
        }
        .task { await model.load(api: auth.api) }
    }

    @ViewBuilder
    private func taskList(_ week: TasksResponse) -> some View {
        ScrollView {
            VStack(spacing: 10) {
                ForEach(week.tasks) { task in
                    taskCard(task, weekStart: week.weekStart)
                }
            }
            .padding(16)
        }
    }

    @ViewBuilder
    private func taskCard(_ task: WeekTask, weekStart: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(task.title).font(.headline).foregroundStyle(FPTheme.foreground)
            HStack(spacing: 4) {
                ForEach(0..<7, id: \.self) { offset in
                    let date = dayDate(weekStart: weekStart, offset: offset)
                    let done = task.doneDays.contains(date)
                    Button {
                        Task { await model.toggle(api: auth.api, task: task, date: date, done: !done) }
                    } label: {
                        Text(dayLabels[offset])
                            .font(.caption.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(done ? FPTheme.primary : FPTheme.secondary)
                            .foregroundStyle(done ? FPTheme.primaryForeground : FPTheme.foreground)
                            .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.sm))
                    }
                }
            }
            ProgressView(value: Double(task.compliance) / 100.0)
                .tint(FPTheme.primary)
            Text("Соблюдение: \(task.compliance)%")
                .font(.footnote)
                .foregroundStyle(FPTheme.mutedForeground)
        }
        .padding(16)
        .background(FPTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
        .overlay(
            RoundedRectangle(cornerRadius: FPTheme.Radius.control)
                .stroke(FPTheme.border, lineWidth: 1)
        )
    }

    /// Дата дня недели: weekStart (понедельник, YYYY-MM-DD) + offset дней.
    private func dayDate(weekStart: String, offset: Int) -> String {
        guard let monday = ISO8601DateFormatter.dateOnly.date(from: String(weekStart.prefix(10))),
              let day = Calendar.current.date(byAdding: .day, value: offset, to: monday)
        else { return weekStart }
        return ISO8601DateFormatter.dateOnly.string(from: day)
    }
}
