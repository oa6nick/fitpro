import SwiftUI

/// Кабинет тренера — Ф3: дежурные сценарии поверх реального API.
struct TrainerHomeView: View {
    let user: User

    var body: some View {
        TabView {
            TrainerDashboardView()
                .tabItem { Label("Дашборд", systemImage: "square.grid.2x2.fill") }
            TrainerClientsView()
                .tabItem { Label("Клиенты", systemImage: "person.2.fill") }
            ReviewView()
                .tabItem { Label("Проверка", systemImage: "doc.text.fill") }
            TrainerNotificationsView()
                .tabItem { Label("События", systemImage: "bell.fill") }
            ProfileTab(user: user)
                .tabItem { Label("Профиль", systemImage: "person.fill") }
        }
        .tint(FPTheme.primary)
    }
}
