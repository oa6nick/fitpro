package com.oasixlab.fitpro.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Токены, которым нет места в Material ColorScheme (success/warning/info/…). */
data class ExtraColors(
    val success: Color,
    val warning: Color,
    val info: Color,
    val destructiveSoft: Color,
    val mutedForeground: Color,
    val border: Color,
    val input: Color,
)

val LocalExtraColors = staticCompositionLocalOf<ExtraColors> {
    error("ExtraColors не предоставлены — оберни в FitProTheme")
}

private val LightColorScheme = lightColorScheme(
    primary = LightTokens.primary,
    onPrimary = LightTokens.primaryForeground,
    secondary = LightTokens.secondary,
    onSecondary = LightTokens.foreground,
    // Индикатор выбранной вкладки NavigationBar — акцент из токенов, не Material-фиолетовый.
    secondaryContainer = LightTokens.accent,
    onSecondaryContainer = LightTokens.accentForeground,
    tertiary = LightTokens.accent,
    onTertiary = LightTokens.accentForeground,
    background = LightTokens.background,
    onBackground = LightTokens.foreground,
    surface = LightTokens.card,
    onSurface = LightTokens.foreground,
    surfaceVariant = LightTokens.muted,
    onSurfaceVariant = LightTokens.mutedForeground,
    error = LightTokens.destructive,
    onError = LightTokens.primaryForeground,
    outline = LightTokens.border,
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkTokens.primary,
    onPrimary = DarkTokens.primaryForeground,
    secondary = DarkTokens.secondary,
    onSecondary = DarkTokens.foreground,
    secondaryContainer = DarkTokens.accent,
    onSecondaryContainer = DarkTokens.accentForeground,
    tertiary = DarkTokens.accent,
    onTertiary = DarkTokens.accentForeground,
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

// Радиусы веба: sm 8 / md 12 / control 16 / panel 20 (tailwind borderRadius)
private val FitProShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(20.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

@Composable
fun FitProTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val extra = if (darkTheme) {
        ExtraColors(
            success = DarkTokens.success,
            warning = DarkTokens.warning,
            info = DarkTokens.info,
            destructiveSoft = DarkTokens.destructiveSoft,
            mutedForeground = DarkTokens.mutedForeground,
            border = DarkTokens.border,
            input = DarkTokens.input,
        )
    } else {
        ExtraColors(
            success = LightTokens.success,
            warning = LightTokens.warning,
            info = LightTokens.info,
            destructiveSoft = LightTokens.destructiveSoft,
            mutedForeground = LightTokens.mutedForeground,
            border = LightTokens.border,
            input = LightTokens.input,
        )
    }
    CompositionLocalProvider(LocalExtraColors provides extra) {
        MaterialTheme(
            colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
            shapes = FitProShapes,
            typography = FitProTypography,
            content = content,
        )
    }
}
