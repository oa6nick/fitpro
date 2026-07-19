import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var auth
    @State private var email = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                VStack(spacing: 8) {
                    Text("FITPRO")
                        .font(FPTheme.Typography.caption())
                        .tracking(4)
                        .foregroundStyle(FPTheme.mutedForeground)
                    Text("Вход в кабинет")
                        .font(FPTheme.Typography.pageTitle())
                        .foregroundStyle(FPTheme.foreground)
                }

                VStack(spacing: 12) {
                    field("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    secureField("Пароль", text: $password)

                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(FPTheme.destructiveSoft)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    Button(action: submit) {
                        Group {
                            if isSubmitting {
                                ProgressView().tint(FPTheme.primaryForeground)
                            } else {
                                Text("Войти").fontWeight(.semibold)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(FPTheme.primary)
                        .foregroundStyle(FPTheme.primaryForeground)
                        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                    }
                    .disabled(isSubmitting || email.isEmpty || password.isEmpty)
                }
                .padding(20)
                .background(FPTheme.card)
                .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.panel))
                .overlay(
                    RoundedRectangle(cornerRadius: FPTheme.Radius.panel)
                        .stroke(FPTheme.border, lineWidth: 1)
                )

                Spacer()
                Spacer()
            }
            .padding(.horizontal, 20)
        }
    }

    private func field(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .padding(14)
            .background(FPTheme.input.opacity(0.6))
            .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
    }

    private func secureField(_ placeholder: String, text: Binding<String>) -> some View {
        SecureField(placeholder, text: text)
            .textContentType(.password)
            .padding(14)
            .background(FPTheme.input.opacity(0.6))
            .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
    }

    private func submit() {
        errorMessage = nil
        isSubmitting = true
        Task {
            defer { isSubmitting = false }
            do {
                try await auth.login(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
