import Foundation

enum APIConfig {
    /// Для локальной разработки: http://<IP ноутбука>:4000 (сервер: npm run dev).
    static let baseURL = URL(string: "https://fitpro.oasixlab.com")!
}

struct APIError: Error, LocalizedError {
    let status: Int
    let message: String

    var errorDescription: String? { message }
}

/// Тонкий клиент REST API — эквивалент client/src/lib/api.ts, но с bearer-токеном
/// вместо cookie (мобильная авторизация, см. server/src/auth/middleware.ts).
struct APIClient {
    var tokenProvider: () -> String?

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await request(path, method: "GET", body: Optional<Int>.none)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await request(path, method: "POST", body: body)
    }

    func patch<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await request(path, method: "PATCH", body: body)
    }

    /// PUT — полная замена ресурса (шаблоны тренировок, анкета клиента).
    func put<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await request(path, method: "PUT", body: body)
    }

    /// DELETE с телом — так серверный роут снимает отметку подхода.
    func delete<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        try await request(path, method: "DELETE", body: body)
    }

    /// Загрузка фото в /api/uploads (multipart-поле "file", лимит сервера 15 МБ).
    func upload(imageData: Data, mime: String = "image/jpeg") async throws -> String {
        struct UploadResponse: Decodable { let url: String }
        let boundary = "fitpro-\(UUID().uuidString)"
        var req = URLRequest(url: APIConfig.baseURL.appending(path: "/api/uploads"))
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = tokenProvider() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let ext = mime == "image/png" ? "png" : "jpg"
        var body = Data()
        body.append(Data("--\(boundary)\r\n".utf8))
        body.append(Data(
            "Content-Disposition: form-data; name=\"file\"; filename=\"photo.\(ext)\"\r\n".utf8
        ))
        body.append(Data("Content-Type: \(mime)\r\n\r\n".utf8))
        body.append(imageData)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        req.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let serverMessage = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw APIError(status: status, message: serverMessage ?? "Ошибка загрузки (\(status))")
        }
        return try JSONDecoder().decode(UploadResponse.self, from: data).url
    }

    /// Загрузка произвольного файла (PDF/видео/картинка) в /api/uploads —
    /// обобщение upload(imageData:) с явными именем и mime (multipart-поле "file").
    func uploadFile(data: Data, filename: String, mime: String) async throws -> String {
        struct UploadResponse: Decodable { let url: String }
        let boundary = "fitpro-\(UUID().uuidString)"
        var req = URLRequest(url: APIConfig.baseURL.appending(path: "/api/uploads"))
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = tokenProvider() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        var body = Data()
        body.append(Data("--\(boundary)\r\n".utf8))
        body.append(Data(
            "Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".utf8
        ))
        body.append(Data("Content-Type: \(mime)\r\n\r\n".utf8))
        body.append(data)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        req.httpBody = body

        let (respData, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let serverMessage = (try? JSONDecoder().decode([String: String].self, from: respData))?["error"]
            throw APIError(status: status, message: serverMessage ?? "Ошибка загрузки (\(status))")
        }
        return try JSONDecoder().decode(UploadResponse.self, from: respData).url
    }

    private func request<T: Decodable, B: Encodable>(
        _ path: String, method: String, body: B?
    ) async throws -> T {
        var req = URLRequest(url: APIConfig.baseURL.appending(path: path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = tokenProvider() {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            // Сервер кладёт человекочитаемую ошибку в {"error": "..."} (по-русски).
            let serverMessage = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw APIError(status: status, message: serverMessage ?? "Ошибка сети (\(status))")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
