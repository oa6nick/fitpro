import SwiftUI

@MainActor
@Observable
final class WorkoutsModel {
    enum State {
        case loading
        case error(String)
        case ready([Workout])
    }

    var state: State = .loading

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: WorkoutsResponse = try await api.get("/api/workouts/mine")
            state = .ready(res.workouts)
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}

struct WorkoutsView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = WorkoutsModel()

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
                case .ready(let workouts):
                    if workouts.isEmpty {
                        EmptyStateView(
                            title: "Тренировок пока нет",
                            subtitle: "Тренер назначит программу — она появится здесь"
                        )
                    } else {
                        List(workouts) { workout in
                            NavigationLink(value: workout.id) {
                                WorkoutRow(workout: workout)
                            }
                            .listRowBackground(FPTheme.card)
                        }
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("Тренировки")
            .navigationDestination(for: String.self) { id in
                WorkoutDetailView(workoutId: id) {
                    Task { await model.load(api: auth.api) }
                }
            }
        }
        .task { await model.load(api: auth.api) }
    }
}

struct WorkoutRow: View {
    let workout: Workout

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(workout.title ?? "Тренировка")
                    .foregroundStyle(FPTheme.foreground)
                Text(formatDate(workout.date))
                    .font(.footnote)
                    .foregroundStyle(FPTheme.mutedForeground)
            }
            Spacer()
            StatusChip(status: workout.status)
        }
    }
}

struct StatusChip: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "completed": ("Выполнена", FPTheme.success)
        case "skipped": ("Пропущена", FPTheme.warning)
        default: ("Назначена", FPTheme.info)
        }
        Text(label)
            .font(.caption.weight(.medium))
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.14))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

struct ErrorRetryView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Text(message)
                .foregroundStyle(FPTheme.destructiveSoft)
                .multilineTextAlignment(.center)
            Button("Повторить", action: retry)
                .buttonStyle(.borderedProminent)
                .tint(FPTheme.primary)
        }
        .padding(24)
    }
}

struct EmptyStateView: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 6) {
            Text(title).font(.headline).foregroundStyle(FPTheme.foreground)
            Text(subtitle)
                .font(.footnote)
                .foregroundStyle(FPTheme.mutedForeground)
                .multilineTextAlignment(.center)
        }
        .padding(32)
    }
}

/// «03.07.2026» из серверного YYYY-MM-DD.
func formatDate(_ iso: String?) -> String {
    guard let iso else { return "—" }
    let parts = iso.prefix(10).split(separator: "-")
    guard parts.count == 3 else { return iso }
    return "\(parts[2]).\(parts[1]).\(parts[0])"
}
