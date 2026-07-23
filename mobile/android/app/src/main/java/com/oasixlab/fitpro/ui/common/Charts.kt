package com.oasixlab.fitpro.ui.common

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.oasixlab.fitpro.ui.theme.LocalExtraColors

/* ─────────────────────────  Кольцо прогресса  ─────────────────────────
 * Анимированная дуга: трек + прогресс. В центре — произвольный контент. */

@Composable
fun ProgressRing(
    progress: Float,
    modifier: Modifier = Modifier,
    diameter: Dp = 76.dp,
    stroke: Dp = 8.dp,
    color: Color = MaterialTheme.colorScheme.primary,
    trackColor: Color = LocalExtraColors.current.input,
    content: @Composable () -> Unit = {},
) {
    val anim = remember { Animatable(0f) }
    LaunchedEffect(progress) {
        anim.animateTo(progress.coerceIn(0f, 1f), tween(900, easing = FastOutSlowInEasing))
    }
    Box(modifier.size(diameter), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            val sw = stroke.toPx()
            val d = size.minDimension - sw
            val tl = Offset((size.width - d) / 2f, (size.height - d) / 2f)
            drawArc(trackColor, -90f, 360f, false, tl, Size(d, d), style = Stroke(sw, cap = StrokeCap.Round))
            drawArc(color, -90f, 360f * anim.value, false, tl, Size(d, d), style = Stroke(sw, cap = StrokeCap.Round))
        }
        content()
    }
}

/* ─────────────────────────  График-«площадь» динамики  ─────────────────────────
 * Плавная кривая с градиентной заливкой, точками и подписями по оси X.
 * Рисуется анимированно слева направо. */

data class ChartPoint(val label: String, val value: Float)

@Composable
fun LineAreaChart(
    points: List<ChartPoint>,
    modifier: Modifier = Modifier,
    height: Dp = 148.dp,
    lineColor: Color = MaterialTheme.colorScheme.primary,
) {
    val extra = LocalExtraColors.current
    if (points.size < 2) {
        Box(modifier.fillMaxWidth().height(height), contentAlignment = Alignment.Center) {
            Text(
                "Добавьте ещё замер — построим график",
                style = MaterialTheme.typography.bodySmall,
                color = extra.mutedForeground,
            )
        }
        return
    }
    val anim = remember(points) { Animatable(0f) }
    LaunchedEffect(points) { anim.animateTo(1f, tween(1000, easing = FastOutSlowInEasing)) }

    val minV = points.minOf { it.value }
    val maxV = points.maxOf { it.value }
    val range = (maxV - minV).takeIf { it > 0.0001f } ?: 1f
    val dotBg = MaterialTheme.colorScheme.background

    Column(modifier.fillMaxWidth()) {
        Canvas(Modifier.fillMaxWidth().height(height)) {
            val padL = 6.dp.toPx(); val padR = 6.dp.toPx(); val padT = 16.dp.toPx(); val padB = 8.dp.toPx()
            val plotW = size.width - padL - padR
            val plotH = size.height - padT - padB
            val n = points.size
            val pts = points.mapIndexed { i, p ->
                val x = padL + plotW * (i / (n - 1f))
                val y = padT + plotH * (1f - (p.value - minV) / range)
                Offset(x, y)
            }
            val area = Path().apply {
                moveTo(pts.first().x, padT + plotH)
                pts.forEach { lineTo(it.x, it.y) }
                lineTo(pts.last().x, padT + plotH)
                close()
            }
            val line = Path().apply {
                moveTo(pts.first().x, pts.first().y)
                for (k in 1 until pts.size) lineTo(pts[k].x, pts[k].y)
            }
            val revealX = padL + plotW * anim.value
            clipRect(right = revealX) {
                drawPath(
                    area,
                    Brush.verticalGradient(
                        listOf(lineColor.copy(alpha = 0.34f), lineColor.copy(alpha = 0f)),
                        startY = padT, endY = padT + plotH,
                    ),
                )
                drawPath(line, color = lineColor, style = Stroke(3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            pts.forEachIndexed { i, o ->
                if (o.x <= revealX + 0.5f) {
                    val last = i == pts.lastIndex
                    drawCircle(dotBg, (if (last) 7f else 5f) * density, o)
                    drawCircle(lineColor, (if (last) 4.5f else 3f) * density, o)
                }
            }
        }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            points.forEach {
                Text(it.label, style = MaterialTheme.typography.labelSmall, color = extra.mutedForeground, maxLines = 1)
            }
        }
    }
}
