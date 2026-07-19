package com.oasixlab.fitpro.ui.client

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.ClientSummaryResponse
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.NotificationsResponse
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.formatDate
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientProfileViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<ClientSummaryResponse>>(Loadable.Loading)
    val state: StateFlow<Loadable<ClientSummaryResponse>> = _state

    private val _notifications = MutableStateFlow<NotificationsResponse?>(null)
    val notifications: StateFlow<NotificationsResponse?> = _notifications

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.clientSummary() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить профиль")
            }
            // Уведомления — не критичны для экрана: ошибку глотаем, секция просто скрыта.
            _notifications.value = runCatching { apiCall { api.notifications() } }.getOrNull()
        }
    }

    fun readAll() {
        viewModelScope.launch {
            runCatching { apiCall { api.readAllNotifications() } }
            _notifications.value = _notifications.value?.let { current ->
                current.copy(
                    notifications = current.notifications.map { it.copy(read = true) },
                    unread = 0,
                )
            }
        }
    }
}

/** Русские названия бейджей (server/src/services/gamification.ts). */
private val ACHIEVEMENT_LABELS = mapOf(
    "first_workout" to "Первая тренировка",
    "three_measurements" to "3 замера",
    "streak_4" to "4 недели подряд",
)

@Composable
fun ClientProfileTab(
    user: User,
    onLogout: () -> Unit,
    viewModel: ClientProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    val extra = LocalExtraColors.current

    LoadableBox(state, onRetry = viewModel::refresh) { summary ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(summary.client.name, style = MaterialTheme.typography.headlineMedium)
            Text(user.email, color = extra.mutedForeground)

            Card(
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    InfoRow("Цель", summary.client.goal ?: "—")
                    InfoRow("Уровень", summary.client.level ?: "—")
                    InfoRow("Старт программы", formatDate(summary.client.startDate))
                    InfoRow("Стрик", "${summary.client.streakWeeks} нед.")
                }
            }

            summary.payment?.let { payment ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        InfoRow("Оплачено до", formatDate(payment.paidUntil))
                        Row {
                            Text(
                                "Статус: ",
                                style = MaterialTheme.typography.bodyMedium,
                                color = extra.mutedForeground,
                            )
                            Text(
                                if (payment.status == "paid") "оплачено" else "просрочено",
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (payment.status == "paid") extra.success else extra.destructiveSoft,
                            )
                        }
                    }
                }
            }

            if (summary.achievements.isNotEmpty()) {
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Достижения", style = MaterialTheme.typography.titleMedium)
                        summary.achievements.forEach { achievement ->
                            Text(
                                "🏆 ${ACHIEVEMENT_LABELS[achievement.type] ?: achievement.type}",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                    }
                }
            }

            val notifications by viewModel.notifications.collectAsState()
            notifications?.takeIf { it.notifications.isNotEmpty() }?.let { data ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                if (data.unread > 0) "Уведомления (${data.unread})" else "Уведомления",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.weight(1f),
                            )
                            if (data.unread > 0) {
                                TextButton(onClick = viewModel::readAll) { Text("Прочитать все") }
                            }
                        }
                        data.notifications.take(10).forEach { n ->
                            Text(
                                (if (n.read) "" else "● ") + n.text,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (n.read) extra.mutedForeground else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))
            TextButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                Text("Выйти", color = extra.destructiveSoft)
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row {
        Text(
            "$label: ",
            style = MaterialTheme.typography.bodyMedium,
            color = LocalExtraColors.current.mutedForeground,
        )
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
