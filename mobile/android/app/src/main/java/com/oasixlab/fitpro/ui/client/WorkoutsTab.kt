package com.oasixlab.fitpro.ui.client

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.Workout
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
class WorkoutsViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<List<Workout>>>(Loadable.Loading)
    val state: StateFlow<Loadable<List<Workout>>> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.myWorkouts() }.workouts)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить тренировки")
            }
        }
    }
}

/** Двухуровневая вкладка: список → детали (внутренний стек, назад — системной кнопкой). */
@Composable
fun WorkoutsTab(viewModel: WorkoutsViewModel = hiltViewModel()) {
    var openedId by rememberSaveable { mutableStateOf<String?>(null) }

    openedId?.let { id ->
        BackHandler { openedId = null }
        WorkoutDetailScreen(
            workoutId = id,
            onBack = { openedId = null },
            onChanged = viewModel::refresh,
        )
        return
    }

    val state by viewModel.state.collectAsState()
    Column(Modifier.fillMaxSize()) {
        TabHeader("Тренировки")
        LoadableBox(state, onRetry = viewModel::refresh) { workouts ->
            if (workouts.isEmpty()) {
                EmptyTab("Тренировок пока нет", "Тренер назначит программу — она появится здесь")
                return@LoadableBox
            }
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(workouts, key = { it.id }) { workout ->
                    WorkoutCard(workout, onClick = { openedId = workout.id })
                }
            }
        }
    }
}

@Composable
private fun WorkoutCard(workout: Workout, onClick: () -> Unit) {
    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(
                        workout.title ?: "Тренировка",
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(
                        formatDate(workout.date),
                        style = MaterialTheme.typography.bodySmall,
                        color = LocalExtraColors.current.mutedForeground,
                    )
                }
                StatusChip(workout.status)
            }
            workout.tonnage?.let {
                Spacer(Modifier.height(6.dp))
                Text(
                    "Тоннаж: ${it.toInt()} кг",
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
        }
    }
}

@Composable
fun StatusChip(status: String) {
    val extra = LocalExtraColors.current
    val (label, color) = when (status) {
        "completed" -> "Выполнена" to extra.success
        "skipped" -> "Пропущена" to extra.warning
        else -> "Назначена" to extra.info
    }
    Surface(
        shape = MaterialTheme.shapes.small,
        color = color.copy(alpha = 0.14f),
        contentColor = color,
    ) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
        )
    }
}

@Composable
fun EmptyTab(title: String, subtitle: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(
            subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = LocalExtraColors.current.mutedForeground,
        )
    }
}
