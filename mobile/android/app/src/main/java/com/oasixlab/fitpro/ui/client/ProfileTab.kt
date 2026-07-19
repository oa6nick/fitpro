package com.oasixlab.fitpro.ui.client

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.ClientProfile
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

    val profileBusy = MutableStateFlow(false)
    val profileError = MutableStateFlow<String?>(null)

    fun saveProfile(profile: ClientProfile, onDone: () -> Unit) {
        profileBusy.value = true
        profileError.value = null
        viewModelScope.launch {
            try {
                apiCall { api.updateMyProfile(profile) }
                onDone()
            } catch (e: Exception) {
                profileError.value = e.message
            } finally {
                profileBusy.value = false
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
    var showProfileForm by rememberSaveable { mutableStateOf(false) }

    if (showProfileForm) {
        BackHandler { showProfileForm = false }
        val busy by viewModel.profileBusy.collectAsState()
        val error by viewModel.profileError.collectAsState()
        Column(Modifier.fillMaxSize()) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 16.dp),
            ) {
                IconButton(onClick = { showProfileForm = false }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                }
                Text("Анкета", style = MaterialTheme.typography.titleLarge)
            }
            ClientProfileEditor(
                busy = busy,
                error = error,
                onSave = { profile ->
                    viewModel.saveProfile(profile) { showProfileForm = false }
                },
            )
        }
        return
    }

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

            Card(
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Анкета", style = MaterialTheme.typography.titleMedium)
                    Text(
                        "Опыт, травмы, образ жизни — чтобы тренер подобрал программу",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                    OutlinedButton(
                        onClick = { showProfileForm = true },
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text("Заполнить/Изменить") }
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

/**
 * Форма анкеты клиента (общая: клиент — updateMyProfile, тренер — updateClientProfile).
 * TODO: API не отдаёт текущую анкету (ClientSummaryResponse без profile, GET-эндпоинта нет),
 * поэтому в v1 форма открывается пустой и просто сохраняет введённое.
 */
@Composable
fun ClientProfileEditor(
    busy: Boolean,
    error: String?,
    onSave: (ClientProfile) -> Unit,
) {
    var experience by rememberSaveable { mutableStateOf("") }
    var injuries by rememberSaveable { mutableStateOf("") }
    var lifestyle by rememberSaveable { mutableStateOf("") }
    var nutrition by rememberSaveable { mutableStateOf("") }
    var steps by rememberSaveable { mutableStateOf("") }
    var equipment by rememberSaveable { mutableStateOf("") }
    var preferences by rememberSaveable { mutableStateOf("") }
    var dislikes by rememberSaveable { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        OutlinedTextField(
            value = experience,
            onValueChange = { experience = it },
            label = { Text("Опыт тренировок") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = injuries,
            onValueChange = { injuries = it },
            label = { Text("Травмы и ограничения") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = lifestyle,
            onValueChange = { lifestyle = it },
            label = { Text("Образ жизни") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = nutrition,
            onValueChange = { nutrition = it },
            label = { Text("Питание") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = steps,
            onValueChange = { steps = it },
            label = { Text("Шаги в день") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = equipment,
            onValueChange = { equipment = it },
            label = { Text("Оборудование") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = preferences,
            onValueChange = { preferences = it },
            label = { Text("Что нравится") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = dislikes,
            onValueChange = { dislikes = it },
            label = { Text("Что не нравится") },
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let {
            Text(
                it,
                style = MaterialTheme.typography.bodySmall,
                color = LocalExtraColors.current.destructiveSoft,
            )
        }
        Button(
            enabled = !busy,
            onClick = {
                onSave(
                    ClientProfile(
                        trainingExperience = experience.trim().ifEmpty { null },
                        injuries = injuries.trim().ifEmpty { null },
                        lifestyle = lifestyle.trim().ifEmpty { null },
                        nutrition = nutrition.trim().ifEmpty { null },
                        steps = steps.trim().toIntOrNull(),
                        equipment = equipment.trim().ifEmpty { null },
                        preferences = preferences.trim().ifEmpty { null },
                        dislikes = dislikes.trim().ifEmpty { null },
                    ),
                )
            },
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth().height(52.dp),
        ) { Text("Сохранить") }
        Spacer(Modifier.height(8.dp))
    }
}
