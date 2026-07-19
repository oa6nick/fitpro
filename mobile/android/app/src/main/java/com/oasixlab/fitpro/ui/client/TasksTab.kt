package com.oasixlab.fitpro.ui.client

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.TasksResponse
import com.oasixlab.fitpro.data.api.ToggleTaskRequest
import com.oasixlab.fitpro.data.api.WeekTask
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.TabHeader
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class TasksViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<TasksResponse>>(Loadable.Loading)
    val state: StateFlow<Loadable<TasksResponse>> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.myTasks() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить задачи")
            }
        }
    }

    fun toggle(task: WeekTask, date: String, done: Boolean) {
        // Оптимистично обновляем локально, при ошибке перечитываем неделю.
        val ready = _state.value as? Loadable.Ready ?: return
        _state.value = Loadable.Ready(
            ready.value.copy(
                tasks = ready.value.tasks.map { t ->
                    if (t.id != task.id) return@map t
                    val days = if (done) (t.doneDays + date).distinct() else t.doneDays - date
                    t.copy(doneDays = days, compliance = (days.size * 100.0 / 7).toInt())
                },
            ),
        )
        viewModelScope.launch {
            try {
                apiCall { api.toggleTask(task.id, ToggleTaskRequest(date = date, done = done)) }
            } catch (_: Exception) {
                refresh()
            }
        }
    }
}

private val DAY_LABELS = listOf("Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс")

/** Неделя клиента: сегменты «Привычки» и «Отчёт» (еженедельные ритуалы вместе). */
@Composable
fun TasksTab() {
    var segment by rememberSaveable { mutableIntStateOf(0) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Задачи недели")
        SingleChoiceSegmentedButtonRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
        ) {
            listOf("Привычки", "Отчёт").forEachIndexed { index, label ->
                SegmentedButton(
                    selected = segment == index,
                    onClick = { segment = index },
                    shape = SegmentedButtonDefaults.itemShape(index = index, count = 2),
                ) { Text(label) }
            }
        }
        if (segment == 0) HabitsSection() else ReportSection()
    }
}

@Composable
private fun HabitsSection(viewModel: TasksViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    LoadableBox(state, onRetry = viewModel::refresh) { week ->
        if (week.tasks.isEmpty()) {
            EmptyTab("Задач на неделю нет", "Тренер назначит привычки — отмечайте их здесь")
            return@LoadableBox
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(week.tasks, key = { it.id }) { task ->
                TaskCard(
                    task = task,
                    weekStart = week.weekStart,
                    onToggle = { date, done -> viewModel.toggle(task, date, done) },
                )
            }
        }
    }
}

@Composable
private fun TaskCard(task: WeekTask, weekStart: String, onToggle: (String, Boolean) -> Unit) {
    val monday = runCatching { LocalDate.parse(weekStart.take(10)) }.getOrNull()

    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(task.title, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(10.dp))
            if (monday != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    DAY_LABELS.forEachIndexed { index, label ->
                        val date = monday.plusDays(index.toLong()).toString()
                        val done = date in task.doneDays
                        FilterChip(
                            selected = done,
                            onClick = { onToggle(date, !done) },
                            label = {
                                Text(label, fontSize = 11.sp, maxLines = 1, softWrap = false)
                            },
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
            LinearProgressIndicator(
                progress = { task.compliance / 100f },
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Соблюдение: ${task.compliance}%",
                style = MaterialTheme.typography.bodySmall,
                color = LocalExtraColors.current.mutedForeground,
            )
        }
    }
}
