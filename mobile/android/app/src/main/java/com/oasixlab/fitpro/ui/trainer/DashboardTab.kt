package com.oasixlab.fitpro.ui.trainer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.DashboardResponse
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.apiCall
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
class DashboardViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<DashboardResponse>>(Loadable.Loading)
    val state: StateFlow<Loadable<DashboardResponse>> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.dashboard() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить дашборд")
            }
        }
    }
}

@Composable
fun DashboardTab(viewModel: DashboardViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val extra = LocalExtraColors.current

    Column(Modifier.fillMaxSize()) {
        TabHeader("Дашборд")
        LoadableBox(state, onRetry = viewModel::refresh) { data ->
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatCard("Клиентов", data.counts.total, Modifier.weight(1f))
                        StatCard("Активных", data.counts.active, Modifier.weight(1f))
                        StatCard("Заявки", data.counts.newRequests, Modifier.weight(1f))
                    }
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatCard(
                            "Зона риска", data.counts.atRisk, Modifier.weight(1f),
                            tone = if (data.counts.atRisk > 0) extra.warning else null,
                        )
                        StatCard(
                            "Заканчивают", data.counts.ending, Modifier.weight(1f),
                            tone = if (data.counts.ending > 0) extra.info else null,
                        )
                        StatCard(
                            "Непроверено", data.counts.unreviewed, Modifier.weight(1f),
                            tone = if (data.counts.unreviewed > 0) MaterialTheme.colorScheme.primary else null,
                        )
                    }
                }

                if (data.atRisk.isNotEmpty()) {
                    item { SectionTitle("Зона риска — 7+ дней без активности") }
                    items(data.atRisk.size) { i ->
                        val c = data.atRisk[i]
                        ListCard(
                            title = c.name,
                            subtitle = c.lastActivityAt?.let { "Активность: ${formatDate(it)}" }
                                ?: "Активности ещё не было",
                        )
                    }
                }
                if (data.ending.isNotEmpty()) {
                    item { SectionTitle("Сопровождение заканчивается") }
                    items(data.ending.size) { i ->
                        val c = data.ending[i]
                        ListCard(title = c.name, subtitle = "Осталось дней: ${c.daysToEnd}")
                    }
                }
                if (data.newRequests.isNotEmpty()) {
                    item { SectionTitle("Новые заявки") }
                    items(data.newRequests.size) { i ->
                        val c = data.newRequests[i]
                        ListCard(title = c.name, subtitle = FUNNEL_LABELS[c.funnelStatus] ?: c.funnelStatus)
                    }
                }
            }
        }
    }
}

val FUNNEL_LABELS = mapOf(
    "new" to "Новая заявка",
    "profile_filled" to "Анкета заполнена",
    "call" to "Созвон",
    "awaiting_payment" to "Ждёт оплату",
    "active" to "Активный",
    "frozen" to "Заморожен",
    "ending" to "Заканчивает",
    "archived" to "Архив",
)

@Composable
private fun StatCard(label: String, value: Int, modifier: Modifier = Modifier, tone: Color? = null) {
    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = modifier,
    ) {
        Column(Modifier.padding(horizontal = 12.dp, vertical = 14.dp)) {
            Text(
                "$value",
                style = MaterialTheme.typography.headlineMedium,
                color = tone ?: MaterialTheme.colorScheme.onSurface,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                label,
                style = MaterialTheme.typography.labelMedium,
                color = LocalExtraColors.current.mutedForeground,
                maxLines = 1,
            )
        }
    }
}

@Composable
fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium,
        modifier = Modifier.padding(top = 6.dp),
    )
}

@Composable
fun ListCard(title: String, subtitle: String?, onClick: (() -> Unit)? = null) {
    val colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    val content: @Composable () -> Unit = {
        Column(Modifier.padding(14.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            subtitle?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
        }
    }
    if (onClick != null) {
        Card(
            shape = MaterialTheme.shapes.medium,
            colors = colors,
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
        ) { content() }
    } else {
        Card(
            shape = MaterialTheme.shapes.medium,
            colors = colors,
            modifier = Modifier.fillMaxWidth(),
        ) { content() }
    }
}
