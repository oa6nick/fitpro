@file:OptIn(androidx.compose.ui.text.ExperimentalTextApi::class)

package com.oasixlab.fitpro.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.oasixlab.fitpro.R

// Шрифты Coachly: Sora — заголовки/числа (характерный гротеск), Manrope — текст/подписи
// (тёплый, современный, читаемый). Оба — вариативные TTF; веса задаём через FontVariation.

private fun sora(weight: Int) = Font(
    R.font.sora,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

private fun manrope(weight: Int) = Font(
    R.font.manrope,
    weight = FontWeight(weight),
    variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

val Sora = FontFamily(sora(500), sora(600), sora(700), sora(800))
val Manrope = FontFamily(manrope(400), manrope(500), manrope(600), manrope(700))

/** Явная типо-шкала с ролями. Sora — крупное и числа, Manrope — тело и подписи. */
val FitProTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = Sora, fontSize = 40.sp, fontWeight = FontWeight(800),
        lineHeight = 44.sp, letterSpacing = (-0.02).sp,
    ),
    headlineMedium = TextStyle( // заголовок экрана
        fontFamily = Sora, fontSize = 26.sp, fontWeight = FontWeight(700),
        lineHeight = 30.sp, letterSpacing = (-0.4).sp,
    ),
    titleLarge = TextStyle( // заголовок секции
        fontFamily = Sora, fontSize = 20.sp, fontWeight = FontWeight(700),
        lineHeight = 25.sp, letterSpacing = (-0.2).sp,
    ),
    titleMedium = TextStyle( // заголовок карточки
        fontFamily = Sora, fontSize = 16.sp, fontWeight = FontWeight(600),
        lineHeight = 21.sp, letterSpacing = (-0.1).sp,
    ),
    titleSmall = TextStyle(
        fontFamily = Manrope, fontSize = 15.sp, fontWeight = FontWeight(600),
        lineHeight = 20.sp,
    ),
    bodyLarge = TextStyle(fontFamily = Manrope, fontSize = 16.sp, lineHeight = 24.sp),
    bodyMedium = TextStyle(fontFamily = Manrope, fontSize = 14.sp, lineHeight = 21.sp),
    bodySmall = TextStyle(
        fontFamily = Manrope, fontSize = 12.5.sp, fontWeight = FontWeight(500), lineHeight = 18.sp,
    ),
    labelLarge = TextStyle( // текст кнопок
        fontFamily = Manrope, fontSize = 14.sp, fontWeight = FontWeight(700),
    ),
    labelMedium = TextStyle( // чипы/статусы
        fontFamily = Manrope, fontSize = 12.sp, fontWeight = FontWeight(600), letterSpacing = 0.1.sp,
    ),
    labelSmall = TextStyle( // eyebrow / caption
        fontFamily = Manrope, fontSize = 11.sp, fontWeight = FontWeight(600), letterSpacing = 1.2.sp,
    ),
)
