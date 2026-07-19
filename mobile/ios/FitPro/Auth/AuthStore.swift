import Foundation
import Observation

/// Токен сессии в памяти, доступный из nonisolated-сети без actor-изоляции.
/// Нужен, потому что Keychain у неподписанной сборки на симуляторе (Appetize)
/// возвращает errSecMissingEntitlement — save молча падает, read даёт nil.
/// Keychain остаётся как best-effort персистентность между запусками.
final class TokenHolder: @unchecked Sendable {
    private let lock = NSLock()
    private var value: String?
    func get() -> String? { lock.lock(); defer { lock.unlock() }; return value }
    func set(_ v: String?) { lock.lock(); defer { lock.unlock() }; value = v }
}

@MainActor
@Observable
final class AuthStore {
    enum Session: Equatable {
        case loading
        case loggedOut
        case active(User)
    }

    private(set) var session: Session = .loading
    private static let tokenKey = "fitpro_token"
    private let tokenHolder = TokenHolder()

    var api: APIClient {
        APIClient(tokenProvider: { [tokenHolder] in
            tokenHolder.get() ?? Keychain.read(key: Self.tokenKey)
        })
    }

    /// На старте: токен из Keychain → /api/auth/me (протухший токен = user:null).
    func restore() async {
        guard let saved = Keychain.read(key: Self.tokenKey) else {
            session = .loggedOut
            return
        }
        tokenHolder.set(saved)
        do {
            let me: MeResponse = try await api.get("/api/auth/me")
            if let user = me.user {
                session = .active(user)
            } else {
                clearToken()
                session = .loggedOut
            }
        } catch {
            // Сеть недоступна — не разлогиниваем, покажем логин при следующем старте.
            session = .loggedOut
        }
    }

    func login(email: String, password: String) async throws {
        // Явная top-level модель (LoginRequestBody) с явным mobile — исключаем
        // любые сюрпризы кодирования локальной структуры с дефолтным полем.
        let res: LoginResponse = try await api.post(
            "/api/auth/login",
            body: LoginRequestBody(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                mobile: true
            )
        )
        saveToken(res.token)
        session = .active(res.user)
    }

    func logout() {
        clearToken()
        session = .loggedOut
    }

    /// Токен — сперва в память (надёжно на симуляторе), затем best-effort в Keychain.
    private func saveToken(_ token: String) {
        tokenHolder.set(token)
        Keychain.save(token, key: Self.tokenKey)
    }

    private func clearToken() {
        tokenHolder.set(nil)
        Keychain.delete(key: Self.tokenKey)
    }

    /// Саморегистрация тренера. register отвечает cookie — bearer-токен добираем логином.
    func registerTrainer(name: String, email: String, password: String) async throws {
        let _: UserResponse = try await api.post(
            "/api/auth/register",
            body: RegisterRequest(email: email, password: password, name: name)
        )
        try await login(email: email, password: password)
    }

    func inviteInfo(token: String) async throws -> InviteInfo {
        let res: InviteInfoResponse = try await api.get("/api/auth/invite/\(token)")
        return res.invite
    }

    /// Клиент по инвайту: accept создаёт аккаунт, токен добираем логином.
    func acceptInvite(token: String, email: String, password: String) async throws {
        let _: UserResponse = try await api.post(
            "/api/auth/invite/\(token)/accept",
            body: AcceptInviteRequest(email: email, password: password)
        )
        try await login(email: email, password: password)
    }
}
