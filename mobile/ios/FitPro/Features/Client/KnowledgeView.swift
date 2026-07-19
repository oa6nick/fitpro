import SwiftUI

@MainActor
@Observable
final class KnowledgeModel {
    enum State {
        case loading
        case error(String)
        case ready(KnowledgeResponse)
    }

    var state: State = .loading

    func load(api: APIClient) async {
        state = .loading
        do {
            let res: KnowledgeResponse = try await api.get("/api/knowledge/mine")
            state = .ready(res)
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}

struct KnowledgeView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.openURL) private var openURL
    @State private var model = KnowledgeModel()

    private let categoryLabels = [
        "nutrition": "Питание", "training": "Тренинг",
        "measurements": "Замеры", "recovery": "Восстановление",
    ]
    private let typeLabels = ["pdf": "PDF", "video": "Видео", "checklist": "Чек-лист"]

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
                case .ready(let data):
                    if data.items.isEmpty {
                        EmptyStateView(
                            title: "Материалов пока нет",
                            subtitle: "Тренер откроет их по мере программы"
                        )
                    } else {
                        list(data)
                    }
                }
            }
            .navigationTitle("Материалы")
        }
        .task { await model.load(api: auth.api) }
    }

    @ViewBuilder
    private func list(_ data: KnowledgeResponse) -> some View {
        List {
            Text("Неделя программы: \(data.currentWeek)")
                .font(.footnote)
                .foregroundStyle(FPTheme.mutedForeground)
                .listRowBackground(Color.clear)

            ForEach(data.items) { item in
                Button {
                    open(item)
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(categoryLabels[item.category] ?? item.category) · \(typeLabels[item.type] ?? item.type)")
                                .font(.caption2)
                                .foregroundStyle(FPTheme.mutedForeground)
                            Text(item.title).foregroundStyle(FPTheme.foreground)
                            if item.locked {
                                Text("Откроется на неделе \(item.unlockWeek)")
                                    .font(.footnote)
                                    .foregroundStyle(FPTheme.mutedForeground)
                            }
                        }
                        Spacer()
                        Image(systemName: item.locked ? "lock.fill" : "arrow.up.right.square")
                            .foregroundStyle(item.locked ? FPTheme.mutedForeground : FPTheme.primary)
                    }
                }
                .disabled(item.locked || item.fileUrl == nil)
                .listRowBackground(FPTheme.card)
            }
        }
        .scrollContentBackground(.hidden)
    }

    private func open(_ item: KnowledgeItem) {
        guard let fileUrl = item.fileUrl else { return }
        let absolute = fileUrl.hasPrefix("http")
            ? fileUrl
            : APIConfig.baseURL.absoluteString + fileUrl
        if let url = URL(string: absolute) {
            openURL(url)
        }
    }
}
