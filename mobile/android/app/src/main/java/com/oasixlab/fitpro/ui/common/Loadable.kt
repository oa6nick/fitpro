package com.oasixlab.fitpro.ui.common

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.oasixlab.fitpro.ui.theme.LocalExtraColors

/** Состояние загрузки экрана — общий паттерн всех вкладок. */
sealed interface Loadable<out T> {
    data object Loading : Loadable<Nothing>
    data class Error(val message: String) : Loadable<Nothing>
    data class Ready<T>(val value: T) : Loadable<T>
}

@Composable
fun <T> LoadableBox(
    state: Loadable<T>,
    onRetry: () -> Unit,
    content: @Composable (T) -> Unit,
) {
    when (state) {
        is Loadable.Loading ->
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
            }

        is Loadable.Error ->
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(state.message, color = LocalExtraColors.current.destructiveSoft)
                Button(onClick = onRetry) { Text("Повторить") }
            }

        is Loadable.Ready -> content(state.value)
    }
}

/** Заголовок вкладки в стиле oasix: eyebrow-надпись + крупный Euclid-заголовок. */
@Composable
fun TabHeader(title: String, eyebrow: String = "COACHLY") {
    Column(Modifier.padding(start = 20.dp, end = 20.dp, top = 14.dp, bottom = 6.dp)) {
        Text(
            eyebrow,
            style = MaterialTheme.typography.labelSmall,
            color = LocalExtraColors.current.mutedForeground,
        )
        Text(title, style = MaterialTheme.typography.headlineMedium)
    }
}

/** «03.07.2026» из серверного YYYY-MM-DD; на неожиданный формат отвечаем как есть. */
fun formatDate(iso: String?): String {
    if (iso == null) return "—"
    val parts = iso.take(10).split("-")
    return if (parts.size == 3) "${parts[2]}.${parts[1]}.${parts[0]}" else iso
}
