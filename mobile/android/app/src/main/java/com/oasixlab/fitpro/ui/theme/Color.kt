package com.oasixlab.fitpro.ui.theme

import androidx.compose.ui.graphics.Color

// Дизайн-токены Coachly — «Тёплый уголь + один коралл» (направление B) с дисциплиной ролей.
// Нейтрали тёплые, с 3 уровнями поверхности и ВИДИМОЙ единой рамкой. Коралл — ТОЛЬКО
// для главного действия/выбора/ключевых данных. Иконки/заголовки/структура — нейтральные.
// Статусы (успех/внимание/опасно/инфо) — отдельная семантика, не акцент.

object DarkTokens {
    val background = Color(0xFF131010)        // тёплый уголь — фон (чуть глубже под стекло)
    val card = Color(0xFF201C19)              // fallback-заливка (стекло рисуется в OasixCard)
    val cardElevated = Color(0xFF2A2521)      // поверхность 2 (приподнятое/hero)
    val popover = Color(0xFF272320)
    val foreground = Color(0xFFF6F2EC)        // тёплый белый — основной текст
    val mutedForeground = Color(0xFFB4ABA0)   // тёплый серый — вторичный текст (читаемо)
    val faint = Color(0xFF8B8177)             // третичный/подписи

    val primary = Color(0xFFF0663F)           // КОРАЛЛ — только действие/выбор/ключевые данные
    val primaryForeground = Color(0xFF2A0E06)  // тёмный текст на коралле
    val accent = Color(0xFF3A241C)            // приглушённый коралл-фон (tint)
    val accentForeground = Color(0xFFFFB59E)  // светлый коралл — текст на tint

    // Второй «акцент» больше не нужен — иконки нейтральные. Оставляем нейтральный тон.
    val accent2 = Color(0xFFC9BFB4)           // нейтральные иконки-бейджи
    val accent2Foreground = Color(0xFF161311)

    val secondary = Color(0xFF2A2521)
    val muted = Color(0xFF2A2521)

    val success = Color(0xFF46B27C)           // тёплый зелёный
    val warning = Color(0xFFE0A83E)           // янтарь
    val info = Color(0xFF5B93E0)              // единственная прохладная нота — инфо
    val destructive = Color(0xFFE5484D)       // чёткий красный (отделён от коралла)
    val destructiveSoft = Color(0xFFF47174)

    // Светлый «стеклянный» край — читается на тёмном ВСЕГДА (суть глазморфизма).
    val border = Color(0x24FFFFFF)            // белый ~14% — видимая рамка
    val borderStrong = Color(0x3DFFFFFF)      // белый ~24%
    val input = Color(0x14FFFFFF)             // стеклянная заливка полей
    val glassHi = Color(0x33FFFFFF)           // верхний блик края (~20%)
    val glassLo = Color(0x0DFFFFFF)           // нижний край (~5%)
}
