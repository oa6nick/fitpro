import SwiftUI
import UIKit

/// Дизайн-токены Coachly — «Тёплый уголь + один коралл» + стекло (glassmorphism).
/// Приложение тёмное всегда (как Android). Коралл — только действие/выбор/данные.
/// Синхронно с mobile/android .../ui/theme/Color.kt.
enum FPTheme {
    // MARK: Цвета (dark-only)

    static let background = c(0x131010)          // тёплый уголь — фон
    static let card = c(0x201C19)                // fallback-заливка (стекло — .glassCard())
    static let cardElevated = c(0x2A2521)
    static let popover = c(0x272320)
    static let foreground = Color.white          // чистый белый — основной текст
    static let mutedForeground = c(0xC7CDD7)     // светлый вторичный (читаемо)
    static let faint = c(0x8B8177)

    static let primary = c(0xFF6B4A)             // КОРАЛЛ — действие/выбор/данные
    static let primaryForeground = c(0x2A0E06)
    static let accent = c(0x3A241C)
    static let accentForeground = c(0xFFB59E)

    static let secondary = c(0x2A2521)
    static let muted = c(0x2A2521)

    static let success = c(0x46B27C)             // изумруд
    static let warning = c(0xE0A83E)             // янтарь
    static let info = c(0x5B93E0)                // синий (единственная холодная нота)
    static let destructive = c(0xE5484D)         // чёткий красный
    static let destructiveSoft = c(0xF47174)

    static let input = Color.white.opacity(0.06)
    static let border = Color.white.opacity(0.14)    // светлый стеклянный край

    // MARK: Стекло (glassmorphism) — светлый край читается на тёмном ВСЕГДА

    enum Glass {
        static let fillTop = Color.white.opacity(0.075)
        static let fillBottom = Color.white.opacity(0.022)
        static let fillTopHi = Color.white.opacity(0.11)
        static let fillBottomHi = Color.white.opacity(0.035)
        static let edgeTop = Color.white.opacity(0.30)
        static let edgeBottom = Color.white.opacity(0.06)
        static let border = Color.white.opacity(0.14)
    }

    // MARK: Радиусы

    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let control: CGFloat = 16
        static let panel: CGFloat = 20
        static let hero: CGFloat = 22
        static let shell: CGFloat = 32
    }

    // MARK: Типографика — Sora (заголовки/числа) + Manrope (текст)

    enum Typography {
        static func display() -> Font { sora(size: 40, weight: .heavy) }
        static func pageTitle() -> Font { sora(size: 26, weight: .bold) }
        static func sectionTitle() -> Font { sora(size: 20, weight: .bold) }
        static func cardTitle() -> Font { sora(size: 16, weight: .semibold) }
        static func body() -> Font { manrope(size: 14, weight: .regular) }
        static func bodySmall() -> Font { manrope(size: 12.5, weight: .medium) }
        static func label() -> Font { manrope(size: 12, weight: .semibold) }
        static func eyebrow() -> Font { manrope(size: 11, weight: .semibold) }
        static func caption() -> Font { manrope(size: 11.5, weight: .semibold) }

        static func sora(size: CGFloat, weight: Font.Weight) -> Font {
            UIFont(name: "Sora", size: size) != nil
                ? .custom("Sora", size: size).weight(weight)
                : .system(size: size, weight: weight, design: .rounded)
        }
        static func manrope(size: CGFloat, weight: Font.Weight) -> Font {
            UIFont(name: "Manrope", size: size) != nil
                ? .custom("Manrope", size: size).weight(weight)
                : .system(size: size, weight: weight)
        }
    }

    private static func c(_ rgb: UInt32) -> Color { Color(UIColor(rgb: rgb)) }
}

// MARK: - Стеклянная карточка (единый компонент)

extension View {
    /// Стеклянная панель: полупрозрачная заливка + верхний блик + светлый край.
    func glassCard(
        elevated: Bool = false,
        radius: CGFloat = FPTheme.Radius.hero,
        padding: CGFloat = 16
    ) -> some View {
        self
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: elevated
                        ? [FPTheme.Glass.fillTopHi, FPTheme.Glass.fillBottomHi]
                        : [FPTheme.Glass.fillTop, FPTheme.Glass.fillBottom],
                    startPoint: .top, endPoint: .bottom
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(
                        LinearGradient(
                            colors: [FPTheme.Glass.edgeTop, FPTheme.Glass.edgeBottom],
                            startPoint: .top, endPoint: .bottom
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: .black.opacity(0.45), radius: 14, x: 0, y: 8)
    }
}

private extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >> 8) & 0xFF) / 255,
            blue: CGFloat(rgb & 0xFF) / 255,
            alpha: 1
        )
    }
}
