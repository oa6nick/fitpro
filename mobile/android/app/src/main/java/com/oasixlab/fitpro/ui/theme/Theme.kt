package com.oasixlab.fitpro.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Токены, которым нет места в Material ColorScheme (success/warning/info/accent2/…). */
data class ExtraColors(
    val success: Color,
    val warning: Color,
    val info: Color,
    val accent2: Color,          // второй акцент — индиго
    val destructiveSoft: Color,
    val mutedForeground: Color,
    val border: Color,
    val borderStrong: Color,
    val input: Color,
    val cardElevated: Color,
)

val LocalExtraColors = staticCompositionLocalOf<ExtraColors> {
    error("ExtraColors не предоставлены — оберни в FitProTheme")
}

/** Тёплый коралловый «закатный» градиент — акцентные заливки. */
val CoachlyGradient = Brush.horizontalGradient(
    listOf(Color(0xFFFF6B4A), Color(0xFFFFA86B)),
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkTokens.primary,
    onPrimary = DarkTokens.primaryForeground,
    secondary = DarkTokens.secondary,
    onSecondary = DarkTokens.foreground,
    // Индикатор выбора / контейнеры — приглушённый зелёный, не Material-фиолетовый.
    secondaryContainer = DarkTokens.accent,
    onSecondaryContainer = DarkTokens.accentForeground,
    // tertiary — индиго-компаньон (второй акцент).
    tertiary = DarkTokens.accent2,
    onTertiary = DarkTokens.accent2Foreground,
    background = DarkTokens.background,
    onBackground = DarkTokens.foreground,
    surface = DarkTokens.card,
    onSurface = DarkTokens.foreground,
    surfaceVariant = DarkTokens.muted,
    onSurfaceVariant = DarkTokens.mutedForeground,
    error = DarkTokens.destructive,
    onError = DarkTokens.foreground,
    outline = DarkTokens.border,
)

// Радиусы oasix: sm 8 / md 12 / control 16 / panel 22 / pill 28.
private val FitProShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

private val DarkExtra = ExtraColors(
    success = DarkTokens.success,
    warning = DarkTokens.warning,
    info = DarkTokens.info,
    accent2 = DarkTokens.accent2,
    destructiveSoft = DarkTokens.destructiveSoft,
    mutedForeground = DarkTokens.mutedForeground,
    border = DarkTokens.border,
    borderStrong = DarkTokens.borderStrong,
    input = DarkTokens.input,
    cardElevated = DarkTokens.cardElevated,
)

/** Единственная тема Coachly — тёмная, как oasix. Системный светлый режим игнорируется. */
@Composable
fun FitProTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalExtraColors provides DarkExtra) {
        MaterialTheme(
            colorScheme = DarkColorScheme,
            shapes = FitProShapes,
            typography = FitProTypography,
            content = content,
        )
    }
}
