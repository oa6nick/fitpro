package com.oasixlab.fitpro.ui.client

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.R
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.Workout
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.AppearOnce
import com.oasixlab.fitpro.ui.common.ChipTone
import com.oasixlab.fitpro.ui.common.CoachlyChip
import com.oasixlab.fitpro.ui.common.IconBadge
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.MetaRow
import com.oasixlab.fitpro.ui.common.OasixCard
import com.oasixlab.fitpro.ui.common.ProgressRing
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
                contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item { AppearOnce { WorkoutsHeader(workouts) } }
                items(workouts, key = { it.id }) { workout ->
                    WorkoutCard(
                        workout,
                        onClick = { openedId = workout.id },
                        modifier = Modifier.animateItem(),
                    )
                }
            }
        }
    }
}

/** Hero прогресса недели: кольцо «выполнено/всего» + мотивация. */
@Composable
private fun WorkoutsHeader(workouts: List<Workout>) {
    val total = workouts.size
    val done = workouts.count { it.status == "completed" }
    val progress = if (total > 0) done / total.toFloat() else 0f
    OasixCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ProgressRing(progress = progress, diameter = 78.dp) {
                Text(
                    "$done/$total",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    "ПРОГРЕСС НЕДЕЛИ",
                    style = MaterialTheme.typography.labelSmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    "Выполнено $done из $total",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Spacer(Modifier.height(2.dp))
                Text(
                    if (total > 0 && done == total) "Все тренировки закрыты 🔥"
                    else "Осталось ${total - done} — вперёд 💪",
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
        }
    }
}

@Composable
private fun WorkoutCard(workout: Workout, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val completed = workout.status == "completed"
    OasixCard(modifier = modifier, selected = completed, onClick = onClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconBadge(icon = painterResource(R.drawable.ic_fit_gym))
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    workout.title ?: "Тренировка",
                    style = MaterialTheme.typography.titleMedium,
                )
                Spacer(Modifier.height(2.dp))
                MetaRow(icon = painterResource(R.drawable.ic_date), text = formatDate(workout.date))
            }
            StatusChip(workout.status)
        }
        workout.tonnage?.let {
            Spacer(Modifier.height(10.dp))
            MetaRow(
                icon = painterResource(R.drawable.ic_fit_strength),
                text = "Тоннаж: ${it.toInt()} кг",
            )
        }
    }
}

@Composable
fun StatusChip(status: String) {
    val (label, tone) = when (status) {
        "completed" -> "Выполнена" to ChipTone.Success
        "skipped" -> "Пропущена" to ChipTone.Warning
        else -> "Назначена" to ChipTone.Info
    }
    CoachlyChip(label, tone)
}

@Composable
fun EmptyTab(title: String, subtitle: String) {
    AppearOnce {
        Column(
            modifier = Modifier.fillMaxSize().padding(32.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            IconBadge(
                icon = painterResource(R.drawable.ic_fit_gym),
                diameter = 72.dp,
            )
            Text(
                title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = LocalExtraColors.current.mutedForeground,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }
}
