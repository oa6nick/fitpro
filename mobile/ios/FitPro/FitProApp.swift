import SwiftUI

@main
struct FitProApp: App {
    @State private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .task { await auth.restore() }
        }
    }
}

/// Ролевой роутер — эквивалент веб-зон /c/* и /t/* (client/src/App.tsx).
struct RootView: View {
    @Environment(AuthStore.self) private var auth

    var body: some View {
        switch auth.session {
        case .loading:
            ZStack {
                FPTheme.background.ignoresSafeArea()
                ProgressView().tint(FPTheme.primary)
            }
        case .loggedOut:
            AuthFlowView()
        case .active(let user):
            switch user.role {
            case .client: ClientHomeView(user: user)
            case .trainer: TrainerHomeView(user: user)
            }
        }
    }
}
