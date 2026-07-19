import SwiftUI

// Назначение тренировки клиенту (Ф4): из шаблона или ручным конструктором.

struct AssignWorkoutView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss
    let clientId: String
    let clientName: String

    @State private var title = ""
    @State private var date = ISO8601DateFormatter.dateOnly.string(from: .now)
    @State private var segment = 0 // 0 — из шаблона, 1 — вручную
    @State private var templates: [WorkoutTemplateCard]?
    @State private var templatesError: String?
    @State private var selectedTemplateId: String?
    @State private var rows: [WorkoutDraftRow] = []
    @State private var saveError: String?
    @State private var busy = false

    var body: some View {
        ZStack {
            FPTheme.background.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    Text(clientName)
                        .font(.headline)
                        .foregroundStyle(FPTheme.foreground)
                    TextField("Название тренировки", text: $title)
                        .textFieldStyle(.roundedBorder)
                    TextField("Дата (ГГГГ-ММ-ДД)", text: $date)
                        .textFieldStyle(.roundedBorder)

                    Picker("Способ", selection: $segment) {
                        Text("Из шаблона").tag(0)
                        Text("Вручную").tag(1)
                    }
                    .pickerStyle(.segmented)

                    if segment == 0 {
                        templatePicker
                    } else {
                        sectionTitle("Упражнения")
                        WorkoutDraftRowsEditor(rows: $rows)
                    }

                    if let saveError {
                        Text(saveError).font(.footnote).foregroundStyle(FPTheme.destructiveSoft)
                    }

                    Button {
                        Task { await assign() }
                    } label: {
                        Text("Назначить")
                            .fontWeight(.semibold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                    }
                    .background(FPTheme.primary)
                    .foregroundStyle(FPTheme.primaryForeground)
                    .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.control))
                    .disabled(busy || !canAssign)
                }
                .padding(16)
            }
        }
        .navigationTitle("Назначить тренировку")
        .task { await loadTemplates() }
    }

    private var canAssign: Bool {
        segment == 0 ? selectedTemplateId != nil : !rows.isEmpty
    }

    @ViewBuilder
    private var templatePicker: some View {
        if let templates {
            if templates.isEmpty {
                EmptyStateView(
                    title: "Шаблонов пока нет",
                    subtitle: "Создайте шаблон в «Студии» или соберите тренировку вручную"
                )
            } else {
                ForEach(templates) { template in
                    Button {
                        selectedTemplateId = template.id
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(template.name)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(FPTheme.foreground)
                                if let goal = template.goal, !goal.isEmpty {
                                    Text(goal)
                                        .font(.footnote)
                                        .foregroundStyle(FPTheme.mutedForeground)
                                }
                            }
                            Spacer()
                            if selectedTemplateId == template.id {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(FPTheme.primary)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .background(FPTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: FPTheme.Radius.md))
                    }
                }
            }
        } else if let templatesError {
            ErrorRetryView(message: templatesError) {
                Task { await loadTemplates() }
            }
        } else {
            ProgressView().tint(FPTheme.primary)
        }
    }

    private func loadTemplates() async {
        templatesError = nil
        do {
            let res: TemplatesResponse = try await auth.api.get("/api/templates")
            templates = res.templates
        } catch {
            templatesError = error.localizedDescription
        }
    }

    private func assign() async {
        busy = true
        defer { busy = false }
        let request = AssignWorkoutRequest(
            clientId: clientId,
            title: title.isEmpty ? nil : title,
            date: date.trimmingCharacters(in: .whitespaces),
            templateId: segment == 0 ? selectedTemplateId : nil,
            exercises: segment == 1
                ? rows.enumerated().map { index, row in row.draft(order: index) }
                : nil
        )
        do {
            let _: WorkoutOnlyResponse = try await auth.api.post("/api/workouts", body: request)
            dismiss()
        } catch {
            saveError = error.localizedDescription
        }
    }
}
