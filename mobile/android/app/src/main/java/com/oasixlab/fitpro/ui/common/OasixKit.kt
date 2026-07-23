package com.oasixlab.fitpro.ui.common

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.oasixlab.fitpro.ui.theme.LocalExtraColors

/* ─────────────────────────  Стеклянная карточка (glassmorphism)  ─────────────────────────
 * Полупрозрачная заливка с верхним бликом + СВЕТЛЫЙ край (белый), который читается
 * на тёмном всегда — одинаково у всех карт. Выбранное — коралловый край + лёгкий оттенок. */

private val GlassFill = Brush.verticalGradient(
    listOf(Color.White.copy(alpha = 0.075f), Color.White.copy(alpha = 0.022f)),
)
private val GlassFillHi = Brush.verticalGradient(
    listOf(Color.White.copy(alpha = 0.11f), Color.White.copy(alpha = 0.035f)),
)
private val GlassEdge = Brush.verticalGradient(
    listOf(Color.White.copy(alpha = 0.30f), Color.White.copy(alpha = 0.06f)),
)

@Composable
fun OasixCard(
    modifier: Modifier = Modifier,
    selected: Boolean = false,          // статус показывают чипы; карта всегда одинаковая
    onClick: (() -> Unit)? = null,
    elevated: Boolean = false,
    contentSpacing: Dp = 0.dp,
    content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    val shape = MaterialTheme.shapes.large
    var m = modifier
        .fillMaxWidth()
        .shadow(
            elevation = 7.dp,
            shape = shape,
            ambientColor = Color.Black.copy(alpha = 0.35f),
            spotColor = Color.Black.copy(alpha = 0.45f),
        )
        .background(if (elevated) GlassFillHi else GlassFill, shape)
        .border(BorderStroke(1.dp, GlassEdge), shape)
    if (onClick != null) m = m.clickable(onClick = onClick)

    Column(
        modifier = m.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(contentSpacing),
        content = content,
    )
}

/* ─────────────────────────  Чипы  ─────────────────────────
 * Тональные капсулы: зелёная (success), синяя (info), красная (danger), нейтральная. */

enum class ChipTone { Success, Info, Danger, Warning, Neutral }

@Composable
fun CoachlyChip(text: String, tone: ChipTone = ChipTone.Neutral, modifier: Modifier = Modifier) {
    val extra = LocalExtraColors.current
    val color = when (tone) {
        ChipTone.Success -> extra.success
        ChipTone.Info -> extra.info
        ChipTone.Danger -> extra.destructiveSoft
        ChipTone.Warning -> extra.warning
        ChipTone.Neutral -> extra.mutedForeground
    }
    Box(
        modifier
            .background(color.copy(alpha = 0.14f), CircleShape)
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(text, style = MaterialTheme.typography.labelMedium, color = color)
    }
}

/* ─────────────────────────  Ряд стат-плиток  ─────────────────────────
 * Три ячейки «значение / подпись», разделённые вертикальными линиями —
 * как блок On Oasix / Views / Saves в референсе Card Overview. */

data class Stat(val value: String, val label: String)

@Composable
fun StatTiles(stats: List<Stat>, modifier: Modifier = Modifier) {
    val extra = LocalExtraColors.current
    Row(
        modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.4f), MaterialTheme.shapes.medium)
            .border(BorderStroke(1.dp, extra.border), MaterialTheme.shapes.medium),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        stats.forEachIndexed { i, s ->
            Column(
                Modifier.weight(1f).padding(vertical = 12.dp, horizontal = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(
                    s.value,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    s.label,
                    style = MaterialTheme.typography.labelSmall,
                    color = extra.mutedForeground,
                    maxLines = 1,
                )
            }
            if (i != stats.lastIndex) {
                Box(Modifier.width(1.dp).height(30.dp).background(extra.border))
            }
        }
    }
}

/* ─────────────────────────  Строка «иконка + текст»  ───────────────────────── */

@Composable
fun MetaRow(icon: Painter, text: String, modifier: Modifier = Modifier, tint: Color? = null) {
    val extra = LocalExtraColors.current
    val c = tint ?: extra.mutedForeground
    Row(modifier, verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = c, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(text, style = MaterialTheme.typography.bodySmall, color = c, overflow = TextOverflow.Ellipsis, maxLines = 1)
    }
}

/* ─────────────────────────  Круглый кружок-иконка  ─────────────────────────
 * Иконка в круге на приглушённом фоне — акценты категорий/аватары. */

@Composable
fun IconBadge(
    icon: Painter,
    modifier: Modifier = Modifier,
    diameter: Dp = 44.dp,
    background: Color = Color.Unspecified,           // Unspecified → стеклянный кружок
    tint: Color = MaterialTheme.colorScheme.onSurface,
) {
    val shape = CircleShape
    var m = modifier.size(diameter)
    m = if (background == Color.Unspecified) {
        m.background(GlassFillHi, shape).border(BorderStroke(1.dp, GlassEdge), shape)
    } else {
        m.background(background, shape)
    }
    Box(m, contentAlignment = Alignment.Center) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(diameter * 0.5f))
    }
}

/* ─────────────────────────  Заголовок секции  ───────────────────────── */

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text,
        modifier = modifier.padding(top = 4.dp, bottom = 8.dp),
        style = MaterialTheme.typography.titleLarge,
        color = MaterialTheme.colorScheme.onSurface,
    )
}

/* ─────────────────────────  Плавающий пилл-навбар oasix  ─────────────────────────
 * Капсула поверх контента; активная вкладка — иконка в круге с зелёным акцентом. */

data class PillTab(val label: String, val icon: ImageVector? = null, val painter: Painter? = null)

@Composable
fun OasixPillNav(
    tabs: List<PillTab>,
    selected: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val extra = LocalExtraColors.current
    val primary = MaterialTheme.colorScheme.primary
    Row(
        modifier
            .padding(horizontal = 20.dp)
            .fillMaxWidth()
            .height(66.dp)
            .shadow(24.dp, CircleShape, spotColor = Color.Black, ambientColor = Color.Black)
            // Матовое стекло: полу-непрозрачная тёплая база + верхний блик + светлый край.
            .background(Color(0xE01A1613), CircleShape)
            .background(GlassFill, CircleShape)
            .border(BorderStroke(1.dp, GlassEdge), CircleShape)
            .padding(horizontal = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        tabs.forEachIndexed { i, tab ->
            val isSel = i == selected
            val bg by androidx.compose.animation.animateColorAsState(
                if (isSel) primary.copy(alpha = 0.18f) else Color.Transparent,
                animationSpec = androidx.compose.animation.core.tween(240),
                label = "navBg",
            )
            val tint by androidx.compose.animation.animateColorAsState(
                if (isSel) primary else extra.mutedForeground,
                animationSpec = androidx.compose.animation.core.tween(240),
                label = "navTint",
            )
            val scale by androidx.compose.animation.core.animateFloatAsState(
                if (isSel) 1.14f else 1f,
                animationSpec = androidx.compose.animation.core.spring(
                    dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
                ),
                label = "navScale",
            )
            Box(
                Modifier
                    .size(46.dp)
                    .background(bg, CircleShape)
                    .clickable(
                        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
                        indication = null,
                    ) { onSelect(i) },
                contentAlignment = Alignment.Center,
            ) {
                val iconMod = Modifier
                    .size(24.dp)
                    .graphicsLayer { scaleX = scale; scaleY = scale }
                when {
                    tab.painter != null ->
                        Icon(tab.painter, contentDescription = tab.label, tint = tint, modifier = iconMod)
                    tab.icon != null ->
                        Icon(tab.icon, contentDescription = tab.label, tint = tint, modifier = iconMod)
                }
            }
        }
    }
}
