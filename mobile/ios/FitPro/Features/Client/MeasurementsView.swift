import PhotosUI
import SwiftUI

@MainActor
@Observable
final class MeasurementsModel {
    enum State {
        case loading
        case error(String)
        case ready([Measurement])
    }

    var state: State = .loading
    var formError: String?

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: MeasurementsResponse = try await api.get("/api/measurements")
            state = .ready(res.measurements)
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// true = сохранено (закрыть форму и перечитать список).
    func add(api: APIClient, request: CreateMeasurementRequest) async -> Bool {
        do {
            let _: MeasurementResponse = try await api.post("/api/measurements", body: request)
            formError = nil
            await load(api: api)
            return true
        } catch {
            formError = error.localizedDescription
            return false
        }
    }
}

struct MeasurementsView: View {
    @Environment(AuthStore.self) private var auth
    @State private var model = MeasurementsModel()
    @State private var showAdd = false

    var body: some View {
        NavigationStack {
            ZStack {
                FPTheme.background.ignoresSafeArea()
                switch model.state {
                case .loading:
                    ProgressView().tint(FPTheme.primary)
                case .error(let message):
                    ErrorRetryView(message: message) {
                        Task { await model.load(api: auth.api) }
                    }
                case .ready(let measurements):
                    if measurements.isEmpty {
                        EmptyStateView(
                            title: "Замеров пока нет",
                            subtitle: "Добавьте первый — тренер увидит прогресс"
                        )
                    } else {
                        List(measurements) { measurement in
                            MeasurementRow(measurement: measurement)
                                .listRowBackground(FPTheme.card)
                        }
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("Замеры")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .tint(FPTheme.primary)
                }
            }
        }
        .task { await model.load(api: auth.api) }
        .sheet(isPresented: $showAdd) {
            AddMeasurementSheet(errorText: model.formError) { request in
                Task {
                    if await model.add(api: auth.api, request: request) {
                        showAdd = false
                    }
                }
            }
        }
    }
}

/// Абсолютный URL картинки из относительного /uploads/…
func absoluteUrl(_ url: String) -> URL? {
    url.hasPrefix("http")
        ? URL(string: url)
        : URL(string: APIConfig.baseURL.absoluteString + url)
}

struct MeasurementRow: View {
    let measurement: Measurement

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(formatDate(measurement.date))
                .font(.headline)
                .foregroundStyle(FPTheme.foreground)
            HStack(spacing: 16) {
                metric("Вес", measurement.weight, "кг")
                metric("Талия", measurement.waist, "см")
                metric("Бёдра", measurement.hips, "см")
                metric("Грудь", measurement.chest, "см")
            }
            let photos = [measurement.photoBeforeUrl, measurement.photoAfterUrl].compactMap { $0 }
            if !photos.isEmpty {
                HStack(spacing: 8) {
                    ForEach(photos, id: \.self) { url in
                        AsyncImage(url: absoluteUrl(url)) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            FPTheme.muted
                        }
                        .frame(width: 96, height: 96)
                        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
                    }
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func metric(_ label: String, _ value: Double?, _ unit: String) -> some View {
        VStack(alignment: .leading) {
            Text(label).font(.caption2).foregroundStyle(FPTheme.mutedForeground)
            Text(value.map { "\(formatNumber($0)) \(unit)" } ?? "—")
                .font(.subheadline)
                .foregroundStyle(FPTheme.foreground)
        }
    }
}

struct AddMeasurementSheet: View {
    @Environment(AuthStore.self) private var auth
    let errorText: String?
    let onSave: (CreateMeasurementRequest) -> Void

    @State private var date = ISO8601DateFormatter.dateOnly.string(from: .now)
    @State private var weight = ""
    @State private var waist = ""
    @State private var hips = ""
    @State private var chest = ""

    @State private var pickBefore: PhotosPickerItem?
    @State private var pickAfter: PhotosPickerItem?
    @State private var photoBeforeUrl: String?
    @State private var photoAfterUrl: String?
    @State private var uploading = false
    @State private var uploadError: String?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Дата (ГГГГ-ММ-ДД)", text: $date)
                TextField("Вес, кг", text: $weight).keyboardType(.decimalPad)
                TextField("Талия, см", text: $waist).keyboardType(.decimalPad)
                TextField("Бёдра, см", text: $hips).keyboardType(.decimalPad)
                TextField("Грудь, см", text: $chest).keyboardType(.decimalPad)
                Section("Фото прогресса") {
                    PhotosPicker(selection: $pickBefore, matching: .images) {
                        Label(
                            photoBeforeUrl != nil ? "Фото «до» ✓" : "Фото «до»",
                            systemImage: "camera"
                        )
                    }
                    PhotosPicker(selection: $pickAfter, matching: .images) {
                        Label(
                            photoAfterUrl != nil ? "Фото «после» ✓" : "Фото «после»",
                            systemImage: "camera"
                        )
                    }
                    if uploading { ProgressView() }
                }
                if let message = errorText ?? uploadError {
                    Text(message).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                }
            }
            .navigationTitle("Новый замер")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Сохранить") {
                        onSave(
                            CreateMeasurementRequest(
                                date: date.trimmingCharacters(in: .whitespaces),
                                weight: number(weight),
                                waist: number(waist),
                                hips: number(hips),
                                chest: number(chest),
                                photoBeforeUrl: photoBeforeUrl,
                                photoAfterUrl: photoAfterUrl
                            )
                        )
                    }
                    .disabled(uploading)
                }
            }
            .onChange(of: pickBefore) { _, item in
                upload(item) { photoBeforeUrl = $0 }
            }
            .onChange(of: pickAfter) { _, item in
                upload(item) { photoAfterUrl = $0 }
            }
        }
        .presentationDetents([.large])
    }

    private func upload(_ item: PhotosPickerItem?, assign: @escaping (String) -> Void) {
        guard let item else { return }
        uploading = true
        Task {
            defer { uploading = false }
            do {
                guard let data = try await item.loadTransferable(type: Data.self) else { return }
                assign(try await auth.api.upload(imageData: data))
                uploadError = nil
            } catch {
                uploadError = error.localizedDescription
            }
        }
    }

    private func number(_ text: String) -> Double? {
        Double(text.replacingOccurrences(of: ",", with: "."))
    }
}

extension ISO8601DateFormatter {
    /// YYYY-MM-DD — формат дат серверного API.
    static let dateOnly: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
}
