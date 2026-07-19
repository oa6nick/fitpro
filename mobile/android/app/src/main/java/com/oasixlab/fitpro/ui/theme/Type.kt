package com.oasixlab.fitpro.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

// Geist подключается позже: TTF в res/font + FontFamily(Font(R.font.geist_...)).
// До этого — системный шрифт (Roboto), это штатный фолбэк веба.
private val Geist = FontFamily.Default

/** Масштаб .type-* из client/src/index.css (мобильные значения clamp). */
val FitProTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = Geist,
        fontSize = 42.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 41.sp,
        letterSpacing = (-0.02).em,
    ),
    headlineMedium = TextStyle( // .type-page-title
        fontFamily = Geist,
        fontSize = 26.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 29.sp,
        letterSpacing = (-0.01).em,
    ),
    titleLarge = TextStyle( // .type-section-title
        fontFamily = Geist,
        fontSize = 27.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 29.sp,
        letterSpacing = (-0.015).em,
    ),
    labelSmall = TextStyle( // .type-caption/.type-eyebrow
        fontFamily = Geist,
        fontSize = 11.5.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.22.em,
    ),
)
