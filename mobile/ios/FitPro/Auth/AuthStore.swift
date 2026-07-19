import Foundation
import Observation

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

    var api: APIClient {
        APIClient(tokenProvider: { Keychain.read(key: Self.tokenKey) })
    }

    /// На старте: токен из Keychain → /api/auth/me (протухший токен = user:null).
    func restore() async {
        guard Keychain.read(key: Self.tokenKey) != nil else {
            session = .loggedOut
            return
        }
        do {
            let me: MeResponse = try await api.get("/api/auth/me")
            if let user = me.user {
                session = .active(user)
            } else {
                Keychain.delete(key: Self.tokenKey)
                session = .loggedOut
            }
        } catch {
            // Сеть недоступна — не разлогиниваем, покажем логин при следующем старте.
            session = .loggedOut
        }
    }

    func login(email: String, password: String) async throws {
        struct Body: Encodable {
            let email: String
            let password: String
            let mobile = true
        }
        let res: LoginResponse = try await api.post(
            "/api/auth/login",
            body: Body(email: email, password: password)
        )
        Keychain.save(res.token, key: Self.tokenKey)
        session = .active(res.user)
    }

    func logout() {
        Keychain.delete(key: Self.tokenKey)
        session = .loggedOut
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
