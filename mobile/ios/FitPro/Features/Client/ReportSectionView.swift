import Foundation
import PhotosUI
import SwiftUI

@MainActor
@Observable
final class ReportsModel {
    struct Data {
        var form: MyFormResponse
        var submissions: [ReportSubmission]
        var currentWeekStart: String

        var currentSubmitted: Bool {
            submissions.contains { $0.weekStart == currentWeekStart }
        }
    }

    enum State {
        case loading
        case error(String)
        case ready(Data)
    }

    var state: State = .loading
    var answers: [String: String] = [:] // fieldId → значение (photo — URL)
    var uploadingField: String?
    var formError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let form: MyFormResponse = try await api.get("/api/reports/my-form")
            let submissions: SubmissionsResponse = try await api.get("/api/reports/mine")
            state = .ready(
                Data(
                    form: form,
                    submissions: submissions.submissions,
                    currentWeekStart: Self.currentMonday()
                )
            )
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func uploadPhoto(api: APIClient, fieldId: String, item: PhotosPickerItem) async {
        uploadingField = fieldId
        defer { uploadingField = nil }
        do {
            // Foundation.Data явно: ReportsModel.Data (вложенный тип) перекрывает имя.
            guard let data = try await item.loadTransferable(type: Foundation.Data.self) else { return }
            answers[fieldId] = try await api.upload(imageData: data)
            formError = nil
        } catch {
            formError = error.localizedDescription
        }
    }

    func submit(api: APIClient) async {
        guard case .ready(let data) = state, let form = data.form.form else { return }
        do {
            let _: SubmitReportResponse = try await api.post(
                "/api/reports/submit",
                body: SubmitReportRequest(
                    formId: form.id,
                    weekStart: data.currentWeekStart,
                    answers: answers
                        .filter { !$0.value.isEmpty }
                        .map { SubmitAnswer(fieldId: $0.key, value: $0.value) }
                )
            )
            answers = [:]
            await load(api: api)
        } catch {
            formError = error.localizedDescription
        }
    }

    /// Понедельник текущей недели (weekStart серверного API).
    private static func currentMonday() -> String {
        var calendar = Calendar(identifier: .iso8601)
        calendar.firstWeekday = 2
        let start = calendar.dateInterval(of: .weekOfYear, for: .now)?.start ?? .now
        return ISO8601DateFormatter.dateOnly.string(from: start)
    }
}

struct ReportSectionView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = ReportsModel()

    var body: some View {
        Group {
            switch model.state {
            case .loading:
                ProgressView().tint(FPTheme.primary)
            case .error(let message):
                ErrorRetryView(message: message) {
                    Task { await model.load(api: auth.api) }
                }
            case .ready(let data):
                if data.form.form == nil {
                    EmptyStateView(
                        title: "Формы отчёта нет",
                        subtitle: "Тренер ещё не настроил еженедельный отчёт"
                    )
                } else {
                    content(data)
                }
            }
        }
        .task { await model.load(api: auth.api) }
    }

    @ViewBuilder
    private func content(_ data: ReportsModel.Data) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                if data.currentSubmitted {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Отчёт за эту неделю отправлен ✓")
                            .font(.headline)
                            .foregroundStyle(FPTheme.foreground)
                        Text("Тренер проверит и оставит комментарий")
                            .font(.footnote)
                            .foregroundStyle(FPTheme.mutedForeground)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(FPTheme.card)
                    .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                } else {
                    formCard(data)
                }

                if !data.submissions.isEmpty {
                    Text("История").font(.headline).foregroundStyle(FPTheme.foreground)
                    ForEach(data.submissions) { submission in
                        submissionRow(submission)
                    }
                }
            }
            .padding(16)
        }
    }

    @ViewBuilder
    private func formCard(_ data: ReportsModel.Data) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(data.form.form!.name).font(.headline).foregroundStyle(FPTheme.foreground)
            ForEach(data.form.fields.sorted { $0.order < $1.order }) { field in
                fieldInput(field)
            }
            if let error = model.formError {
                Text(error).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
            }
            Button {
                Task { await model.submit(api: auth.api) }
            } label: {
                Text("Отправить отчёт")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .background(FPTheme.primary)
            .foregroundStyle(FPTheme.primaryForeground)
            .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
            .disabled(model.uploadingField != nil)
        }
        .padding(16)
        .background(FPTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
    }

    @ViewBuilder
    private func fieldInput(_ field: ReportField) -> some View {
        if field.type == "photo" {
            ReportPhotoField(field: field, model: model)
        } else {
            TextField(
                field.label,
                text: Binding(
                    get: { model.answers[field.id] ?? "" },
                    set: { model.answers[field.id] = $0 }
                )
            )
            .keyboardType(field.type == "number" ? .decimalPad : .default)
            .textFieldStyle(.roundedBorder)
        }
    }

    @ViewBuilder
    private func submissionRow(_ submission: ReportSubmission) -> some View {
        let (label, color): (String, Color) = switch submission.status {
        case "reviewed": ("Проверен", FPTheme.success)
        case "missed": ("Пропущен", FPTheme.warning)
        default: ("На проверке", FPTheme.info)
        }
        HStack {
            Text("Неделя с \(formatDate(submission.weekStart))")
                .foregroundStyle(FPTheme.foreground)
            Spacer()
            Text(label).font(.caption.weight(.medium)).foregroundStyle(color)
        }
        .padding(14)
        .background(FPTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
    }
}

private struct ReportPhotoField: View {
    @Environment(AuthStore.self) private var auth
    let field: ReportField
    let model: ReportsModel

    @State private var picked: PhotosPickerItem?

    var body: some View {
        PhotosPicker(selection: $picked, matching: .images) {
            HStack {
                if model.uploadingField == field.id {
                    ProgressView()
                } else {
                    Image(systemName: "camera")
                }
                Text((model.answers[field.id]?.isEmpty == false) ? "\(field.label) ✓" : field.label)
            }
        }
        .onChange(of: picked) { _, item in
            guard let item else { return }
            Task { await model.uploadPhoto(api: auth.api, fieldId: field.id, item: item) }
        }
    }
}
