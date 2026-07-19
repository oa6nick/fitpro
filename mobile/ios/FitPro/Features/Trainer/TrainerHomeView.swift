import SwiftUI

/// Кабинет тренера — Ф3/Ф4: дежурные сценарии и конструкторы поверх реального API.
/// «События» отдельной вкладкой больше нет — уведомления живут в профиле.
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
            StudioView()
                .tabItem { Label("Студия", systemImage: "hammer.fill") }
            TrainerProfileView(user: user)
                .tabItem { Label("Профиль", systemImage: "person.fill") }
        }
        .tint(FPTheme.primary)
    }
}
