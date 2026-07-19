import SwiftUI
import UIKit

/// Дизайн-токены FitPro. Источник истины — mobile/design-tokens/tokens.json
/// (снимок client/src/index.css). При изменении веба обновлять оба файла синхронно.
enum FPTheme {
    // MARK: Цвета (light / dark — системная тема, как class-based dark в вебе)

    static let background = dynamic(light: 0xF5F1EA, dark: 0x151515)
    static let foreground = dynamic(light: 0x12141A, dark: 0xFAFAFA)
    static let card = dynamic(light: 0xFCFAF8, dark: 0x1C1C1C)
    static let popover = dynamic(light: 0xFDFDFC, dark: 0x1A1A1A)
    static let primary = dynamic(light: 0x15753D, dark: 0x20D795)
    static let primaryForeground = dynamic(light: 0xF9F6F1, dark: 0x151515)
    static let secondary = dynamic(light: 0xEAE5DC, dark: 0x272727)
    static let muted = dynamic(light: 0xE7E3DA, dark: 0x272727)
    static let mutedForeground = dynamic(light: 0x575C6B, dark: 0xB3B3B3)
    static let accent = dynamic(light: 0xD7EADF, dark: 0x1D352C)
    static let accentForeground = dynamic(light: 0x0E4E29, dark: 0x7DE8C1)
    static let destructive = dynamic(light: 0xB81E1E, dark: 0xEE1D52)
    static let destructiveSoft = dynamic(light: 0xB81E1E, dark: 0xFF708A)
    static let success = dynamic(light: 0x15753D, dark: 0x20D795)
    static let warning = dynamic(light: 0xB8610A, dark: 0xF59F0A)
    static let info = dynamic(light: 0x2256A0, dark: 0x5C95D6)
    static let border = dynamic(light: 0xDAD6CE, dark: 0x303030)
    static let input = dynamic(light: 0xE2DED4, dark: 0x2B2B2B)

    // MARK: Радиусы (веб: --radius и borderRadius из tailwind.config)

    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let control: CGFloat = 16
        static let panel: CGFloat = 20
        static let hero: CGFloat = 28
        static let shell: CGFloat = 32
    }

    // MARK: Типографика (Geist; до добавления TTF — системный шрифт)

    enum Typography {
        static func display() -> Font { geist(size: 41.6, weight: .medium) }
        static func pageTitle() -> Font { geist(size: 25.6, weight: .medium) }
        static func sectionTitle() -> Font { geist(size: 27.2, weight: .medium) }
        static func caption() -> Font { geist(size: 11.5, weight: .semibold) }

        /// Geist Variable подключается через Resources/Fonts + INFOPLIST_KEY_UIAppFonts;
        /// пока TTF не добавлен, UIFont(name:) вернёт nil и работает системный фолбэк.
        static func geist(size: CGFloat, weight: Font.Weight) -> Font {
            if UIFont(name: "Geist", size: size) != nil {
                return .custom("Geist", size: size)
            }
            return .system(size: size, weight: weight)
        }
    }

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { traits in
            UIColor(rgb: traits.userInterfaceStyle == .dark ? dark : light)
        })
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
