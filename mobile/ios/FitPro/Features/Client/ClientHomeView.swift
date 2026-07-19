import SwiftUI

/// Кабинет клиента — Ф2, работает поверх реального API.
struct ClientHomeView: View {
    let user: User

    var body: some View {
        TabView {
            WorkoutsView()
                .tabItem { Label("Тренировки", systemImage: "dumbbell.fill") }
            MeasurementsView()
                .tabItem { Label("Замеры", systemImage: "chart.line.uptrend.xyaxis") }
            TasksView()
                .tabItem { Label("Задачи", systemImage: "checkmark.circle.fill") }
            KnowledgeView()
                .tabItem { Label("Материалы", systemImage: "book.fill") }
            ClientProfileView(user: user)
                .tabItem { Label("Профиль", systemImage: "person.fill") }
        }
        .tint(FPTheme.primary)
    }
}

/// Простой профиль без клиентской сводки — используется в кабинете тренера (Ф3).
struct ProfileTab: View {
    @Environment(AuthStore.self) private var auth
    let user: User

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            VStack(spacing: 16) {
                Text(user.name).font(FPTheme.Typography.pageTitle())
                Text(user.email).foregroundStyle(FPTheme.mutedForeground)
                Button("Выйти") { auth.logout() }
                    .foregroundStyle(FPTheme.destructiveSoft)
            }
        }
    }
}
