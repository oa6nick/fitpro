import Foundation

// Модели повторяют JSON REST API сервера (server/src/routes). До появления
// OpenAPI-контракта (план Ф2) сверять вручную с zod-схемами.

enum UserRole: String, Codable {
    case trainer
    case client
}

struct User: Codable, Equatable, Identifiable {
    let id: String
    let email: String
    let name: String
    let role: UserRole
    var emailVerified: Bool?
}

/// POST /api/auth/login с mobile:true
/// Тело логина: mobile:true → сервер вернёт token в теле (bearer), а не cookie.
struct LoginRequestBody: Encodable {
    let email: String
    let password: String
    let mobile: Bool
}

struct LoginResponse: Codable {
    let token: String
    let user: User
}

/// GET /api/auth/me — user==nil значит «не авторизован» (сервер отвечает 200)
struct MeResponse: Codable {
    let user: User?
}

struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String
}

/// register и invite/accept отвечают { user } и ставят cookie — токен добираем логином.
struct UserResponse: Codable {
    let user: User
}

struct InviteInfo: Codable, Equatable {
    let trainerName: String
    let clientName: String
    var email: String?
}

struct InviteInfoResponse: Codable {
    let invite: InviteInfo
}

struct AcceptInviteRequest: Encodable {
    let email: String
    let password: String
}
