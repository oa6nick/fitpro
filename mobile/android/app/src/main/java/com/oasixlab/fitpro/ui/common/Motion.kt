package com.oasixlab.fitpro.ui.common

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/**
 * Плавное появление контента при первой композиции: fade + подъём снизу.
 * Используем для заголовков/hero, чтобы экран «оживал». Списки анимируются
 * через Modifier.animateItem() прямо в LazyColumn.
 */
@Composable
fun AppearOnce(
    modifier: Modifier = Modifier,
    delayMillis: Int = 0,
    slideDy: Dp = 14.dp,
    content: @Composable () -> Unit,
) {
    val anim = remember { Animatable(0f) }
    val dy = with(LocalDensity.current) { slideDy.toPx() }
    LaunchedEffect(Unit) {
        if (delayMillis > 0) delay(delayMillis.toLong())
        anim.animateTo(1f, tween(durationMillis = 460, easing = FastOutSlowInEasing))
    }
    Box(
        modifier.graphicsLayer {
            alpha = anim.value
            translationY = (1f - anim.value) * dy
        },
    ) { content() }
}
