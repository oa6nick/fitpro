import SwiftUI

/// Экранная цепочка до входа: онбординг → лендинг → логин/регистрация/инвайт.
struct AuthFlowView: View {
    private enum Screen {
        case landing, login, register, join
    }

    @AppStorage("fitpro_onboarding_done") private var onboardingDone = false
    @State private var screen: Screen = .landing

    var body: some View {
        if !onboardingDone {
            OnboardingView { onboardingDone = true }
        } else {
            NavigationStack {
                switch screen {
                case .landing:
                    LandingView(
                        onLogin: { screen = .login },
                        onRegister: { screen = .register },
                        onJoin: { screen = .join }
                    )
                case .login:
                    LoginView()
                        .toolbar { backButton }
                case .register:
                    RegisterTrainerView()
                        .toolbar { backButton }
                case .join:
                    JoinInviteView()
                        .toolbar { backButton }
                }
            }
        }
    }

    private var backButton: some ToolbarContent {
        ToolbarItem(placement: .navigation) {
            Button {
                screen = .landing
            } label: {
                Image(systemName: "chevron.left")
            }
            .tint(FPTheme.primary)
        }
    }
}

/* ------------------------------ Онбординг ------------------------------ */

private struct OnboardingPage: Identifiable {
    let id: Int
    let icon: String
    let title: String
    let text: String
}

private let onboardingPages = [
    OnboardingPage(
        id: 0, icon: "dumbbell.fill",
        title: "Дневник тренировок",
        text: "Программа от тренера всегда в телефоне: отмечайте подходы, веса и повторы — таймер отдыха подскажет паузу"
    ),
    OnboardingPage(
        id: 1, icon: "chart.line.uptrend.xyaxis",
        title: "Прогресс на ладони",
        text: "Замеры, фото «до/после» и привычки недели — тренер видит вашу динамику и вовремя корректирует план"
    ),
    OnboardingPage(
        id: 2, icon: "book.fill",
        title: "Тренер всегда рядом",
        text: "Проверка дневников, еженедельные отчёты и материалы программы открываются по мере вашего прогресса"
    ),
]

struct OnboardingView: View {
    let onFinish: () -> Void
    @State private var page = 0

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            VStack {
                HStack {
                    Text("FITPRO")
                        .font(FPTheme.Typography.caption())
                        .foregroundStyle(FPTheme.mutedForeground)
                    Spacer()
                    Button("Пропустить", action: onFinish)
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                }
                .padding(.horizontal, 24)

                TabView(selection: $page) {
                    ForEach(onboardingPages) { item in
                        VStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(FPTheme.accent)
                                    .frame(width: 120, height: 120)
                                Image(systemName: item.icon)
                                    .font(.system(size: 44))
                                    .foregroundStyle(FPTheme.accentForeground)
                            }
                            Text(item.title)
                                .font(FPTheme.Typography.pageTitle())
                                .foregroundStyle(FPTheme.foreground)
                            Text(item.text)
                                .font(.body)
                                .foregroundStyle(FPTheme.mutedForeground)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 28)
                        }
                        .tag(item.id)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .always))
                .indexViewStyle(.page(backgroundDisplayMode: .always))

                Button {
                    if page == onboardingPages.count - 1 {
                        onFinish()
                    } else {
                        withAnimation { page += 1 }
                    }
                } label: {
                    Text(page == onboardingPages.count - 1 ? "Начать" : "Дальше")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .background(FPTheme.primary)
                .foregroundStyle(FPTheme.primaryForeground)
                .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            }
        }
    }
}

/* ------------------------------- Лендинг ------------------------------- */

struct LandingView: View {
    let onLogin: () -> Void
    let onRegister: () -> Void
    let onJoin: () -> Void

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            VStack(spacing: 10) {
                Spacer()
                Text("FITPRO")
                    .font(FPTheme.Typography.caption())
                    .foregroundStyle(FPTheme.mutedForeground)
                Text("Тренинг под контролем")
                    .font(FPTheme.Typography.pageTitle())
                    .foregroundStyle(FPTheme.foreground)
                Text("Пространство тренера и клиента:\nпрограммы, дневник, прогресс")
                    .font(.body)
                    .foregroundStyle(FPTheme.mutedForeground)
                    .multilineTextAlignment(.center)
                Spacer()

                primaryButton("Войти", action: onLogin)
                secondaryButton("Я тренер — создать аккаунт", action: onRegister)
                secondaryButton("Я клиент — у меня приглашение", action: onJoin)
            }
            .padding(24)
        }
    }

    private func primaryButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .background(FPTheme.primary)
        .foregroundStyle(FPTheme.primaryForeground)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
    }

    private func secondaryButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .foregroundStyle(FPTheme.foreground)
        .overlay(
            RoundedRectangle(cornerRadius: FPTheme.Radius.control)
                .stroke(FPTheme.border, lineWidth: 1)
        )
    }
}

/* --------------------------- Регистрация тренера --------------------------- */

struct RegisterTrainerView: View {
    @Environment(AuthStore.self) private var auth
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            VStack(spacing: 12) {
                Text("Аккаунт тренера")
                    .font(FPTheme.Typography.pageTitle())
                    .foregroundStyle(FPTheme.foreground)
                Text("14 дней бесплатно, до 10 клиентов.\nДля примера сразу появится тестовый клиент.")
                    .font(.footnote)
                    .foregroundStyle(FPTheme.mutedForeground)
                    .multilineTextAlignment(.center)

                Group {
                    TextField("Имя", text: $name)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Пароль (минимум 6 символов)", text: $password)
                }
                .textFieldStyle(.roundedBorder)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(FPTheme.destructiveSoft)
                }

                Button {
                    submit()
                } label: {
                    Group {
                        if isSubmitting {
                            ProgressView().tint(FPTheme.primaryForeground)
                        } else {
                            Text("Создать аккаунт").fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                }
                .background(FPTheme.primary)
                .foregroundStyle(FPTheme.primaryForeground)
                .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                .disabled(isSubmitting || name.isEmpty || email.isEmpty || password.count < 6)
            }
            .padding(24)
        }
    }

    private func submit() {
        errorMessage = nil
        isSubmitting = true
        Task {
            defer { isSubmitting = false }
            do {
                try await auth.registerTrainer(name: name, email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

/* ----------------------------- Инвайт клиента ----------------------------- */

struct JoinInviteView: View {
    @Environment(AuthStore.self) private var auth
    @State private var link = ""
    @State private var invite: InviteInfo?
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isBusy = false

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            VStack(spacing: 12) {
                Text("Вход по приглашению")
                    .font(FPTheme.Typography.pageTitle())
                    .foregroundStyle(FPTheme.foreground)

                if let invite {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Тренер: \(invite.trainerName)")
                        Text("Ваша карточка: \(invite.clientName)")
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(FPTheme.card)
                    .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))

                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                    SecureField("Пароль (минимум 6 символов)", text: $password)
                        .textFieldStyle(.roundedBorder)
                } else {
                    Text("Тренер прислал вам ссылку вида fitpro…/join/… — вставьте её целиком или код после /join/")
                        .font(.footnote)
                        .foregroundStyle(FPTheme.mutedForeground)
                        .multilineTextAlignment(.center)
                    TextField("Ссылка или код приглашения", text: $link)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textFieldStyle(.roundedBorder)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(FPTheme.destructiveSoft)
                }

                Button {
                    invite == nil ? loadInvite() : accept()
                } label: {
                    Group {
                        if isBusy {
                            ProgressView().tint(FPTheme.primaryForeground)
                        } else {
                            Text(invite == nil ? "Продолжить" : "Создать кабинет")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                }
                .background(FPTheme.primary)
                .foregroundStyle(FPTheme.primaryForeground)
                .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                .disabled(
                    isBusy || (invite == nil ? link.isEmpty : email.isEmpty || password.count < 6)
                )
            }
            .padding(24)
        }
    }

    /// Принимаем и полную ссылку …/join/<код>, и голый код.
    private var token: String? {
        let trimmed = link.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let candidate = trimmed.hasSuffix("/") ? String(trimmed.dropLast()) : trimmed
        let tokenPart = candidate.components(separatedBy: "/").last ?? candidate
        return tokenPart.count >= 16 ? tokenPart : nil
    }

    private func loadInvite() {
        guard let token else {
            errorMessage = "Вставьте ссылку-приглашение или код из неё"
            return
        }
        errorMessage = nil
        isBusy = true
        Task {
            defer { isBusy = false }
            do {
                invite = try await auth.inviteInfo(token: token)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func accept() {
        guard let token else { return }
        errorMessage = nil
        isBusy = true
        Task {
            defer { isBusy = false }
            do {
                try await auth.acceptInvite(token: token, email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
