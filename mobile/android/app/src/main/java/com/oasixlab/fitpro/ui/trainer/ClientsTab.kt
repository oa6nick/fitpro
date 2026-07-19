package com.oasixlab.fitpro.ui.trainer

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.ClientDetailResponse
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.TrainerClient
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.client.StatusChip
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.TabHeader
import com.oasixlab.fitpro.ui.common.formatDate
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TrainerClientsViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<List<TrainerClient>>>(Loadable.Loading)
    val state: StateFlow<Loadable<List<TrainerClient>>> = _state

    private val _detail = MutableStateFlow<Loadable<ClientDetailResponse>>(Loadable.Loading)
    val detail: StateFlow<Loadable<ClientDetailResponse>> = _detail

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.trainerClients() }.clients)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить клиентов")
            }
        }
    }

    fun loadDetail(id: String) {
        _detail.value = Loadable.Loading
        viewModelScope.launch {
            _detail.value = try {
                Loadable.Ready(apiCall { api.clientDetail(id) })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить карточку")
            }
        }
    }
}

@Composable
fun ClientsTab(viewModel: TrainerClientsViewModel = hiltViewModel()) {
    var openedId by rememberSaveable { mutableStateOf<String?>(null) }

    openedId?.let { id ->
        BackHandler { openedId = null }
        ClientDetailScreen(viewModel, id, onBack = { openedId = null })
        return
    }

    val state by viewModel.state.collectAsState()
    Column(Modifier.fillMaxSize()) {
        TabHeader("Клиенты")
        LoadableBox(state, onRetry = viewModel::refresh) { clients ->
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(clients, key = { it.id }) { client ->
                    ClientCardRow(client, onClick = { openedId = client.id })
                }
            }
        }
    }
}

@Composable
private fun ClientCardRow(client: TrainerClient, onClick: () -> Unit) {
    val extra = LocalExtraColors.current
    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(14.dp),
        ) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(client.name, style = MaterialTheme.typography.titleSmall)
                    if (client.riskFlag && client.funnelStatus == "active") {
                        Spacer(Modifier.width(6.dp))
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Зона риска",
                            tint = extra.warning,
                            modifier = Modifier.height(16.dp),
                        )
                    }
                }
                Text(
                    listOfNotNull(
                        client.goal,
                        client.streakWeeks.takeIf { it > 0 }?.let { "стрик $it нед." },
                    ).joinToString(" · ").ifEmpty { "—" },
                    style = MaterialTheme.typography.bodySmall,
                    color = extra.mutedForeground,
                )
            }
            FunnelChip(client.funnelStatus)
        }
    }
}

@Composable
fun FunnelChip(status: String) {
    val extra = LocalExtraColors.current
    val color = when (status) {
        "active" -> extra.success
        "new", "profile_filled" -> extra.info
        "awaiting_payment", "ending" -> extra.warning
        "frozen", "archived" -> extra.mutedForeground
        else -> extra.info
    }
    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.14f),
        contentColor = color,
    ) {
        Text(
            FUNNEL_LABELS[status] ?: status,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
        )
    }
}

@Composable
private fun ClientDetailScreen(
    viewModel: TrainerClientsViewModel,
    clientId: String,
    onBack: () -> Unit,
) {
    LaunchedEffect(clientId) { viewModel.loadDetail(clientId) }
    val state by viewModel.detail.collectAsState()

    Column(Modifier.fillMaxSize()) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 16.dp),
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
            }
            Text("Карточка клиента", style = MaterialTheme.typography.titleLarge)
        }
        LoadableBox(state, onRetry = { viewModel.loadDetail(clientId) }) { detail ->
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Card(
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    detail.client.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.weight(1f),
                                )
                                FunnelChip(detail.client.funnelStatus)
                            }
                            InfoLine("Цель", detail.client.goal)
                            InfoLine("Уровень", detail.client.level)
                            InfoLine("Старт", detail.client.startDate?.let(::formatDate))
                            InfoLine("Сопровождение до", detail.client.supportEndDate?.let(::formatDate))
                            InfoLine("Стрик", "${detail.client.streakWeeks} нед.")
                        }
                    }
                }

                if (detail.measurements.isNotEmpty()) {
                    item { SectionTitle("Последние замеры") }
                    items(detail.measurements.take(3), key = { "m" + it.id }) { m ->
                        ListCard(
                            title = formatDate(m.date),
                            subtitle = listOfNotNull(
                                m.weight?.let { "вес $it" },
                                m.waist?.let { "талия $it" },
                            ).joinToString(" · ").ifEmpty { null },
                        )
                    }
                }

                if (detail.workouts.isNotEmpty()) {
                    item { SectionTitle("Тренировки") }
                    items(detail.workouts.take(6), key = { "w" + it.id }) { w ->
                        Card(
                            shape = MaterialTheme.shapes.medium,
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(14.dp),
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(w.title ?: "Тренировка", style = MaterialTheme.typography.titleSmall)
                                    Text(
                                        formatDate(w.date),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = LocalExtraColors.current.mutedForeground,
                                    )
                                }
                                StatusChip(w.status)
                            }
                        }
                    }
                }

                if (detail.notes.isNotEmpty()) {
                    item { SectionTitle("Заметки") }
                    items(detail.notes.take(5), key = { "n" + it.id }) { note ->
                        ListCard(title = note.text, subtitle = formatDate(note.createdAt))
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoLine(label: String, value: String?) {
    Row {
        Text(
            "$label: ",
            style = MaterialTheme.typography.bodySmall,
            color = LocalExtraColors.current.mutedForeground,
        )
        Text(value ?: "—", style = MaterialTheme.typography.bodySmall)
    }
}
