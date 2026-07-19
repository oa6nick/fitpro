package com.oasixlab.fitpro.ui.client

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledIconToggleButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.DeleteLogRequest
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.LogSetRequest
import com.oasixlab.fitpro.data.api.SetLog
import com.oasixlab.fitpro.data.api.WorkoutDetailResponse
import com.oasixlab.fitpro.data.api.WorkoutItem
import com.oasixlab.fitpro.data.api.WorkoutStatusRequest
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
class WorkoutDetailViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<WorkoutDetailResponse>>(Loadable.Loading)
    val state: StateFlow<Loadable<WorkoutDetailResponse>> = _state

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message

    private var workoutId: String? = null

    fun load(id: String) {
        workoutId = id
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.workout(id) })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить тренировку")
            }
        }
    }

    fun consumeMessage() {
        _message.value = null
    }

    /** Отметить подход (upsert на сервере) и обновить логи локально. */
    fun logSet(item: WorkoutItem, setNumber: Int, weight: Double?, reps: Int?) {
        val id = workoutId ?: return
        viewModelScope.launch {
            try {
                val res = apiCall {
                    api.logSet(
                        id,
                        LogSetRequest(
                            workoutExerciseId = item.id,
                            setNumber = setNumber,
                            weight = weight,
                            reps = reps,
                        ),
                    )
                }
                replaceLogs(item.id) { logs ->
                    logs.filterNot { it.setNumber == setNumber } + res.log
                }
            } catch (e: Exception) {
                _message.value = e.message
            }
        }
    }

    fun removeSet(item: WorkoutItem, setNumber: Int) {
        val id = workoutId ?: return
        viewModelScope.launch {
            try {
                apiCall { api.deleteLog(id, DeleteLogRequest(item.id, setNumber)) }
                replaceLogs(item.id) { logs -> logs.filterNot { it.setNumber == setNumber } }
            } catch (e: Exception) {
                _message.value = e.message
            }
        }
    }

    fun complete(feeling: String?, comment: String?, onDone: () -> Unit) {
        val id = workoutId ?: return
        viewModelScope.launch {
            try {
                val res = apiCall {
                    api.setWorkoutStatus(
                        id,
                        WorkoutStatusRequest(
                            status = "completed",
                            feeling = feeling,
                            comment = comment?.takeIf { it.isNotBlank() },
                        ),
                    )
                }
                (_state.value as? Loadable.Ready)?.let {
                    _state.value = Loadable.Ready(it.value.copy(workout = res.workout))
                }
                if (res.earnedAchievements.isNotEmpty()) {
                    _message.value = "Достижение: ${res.earnedAchievements.joinToString()}"
                }
                onDone()
            } catch (e: Exception) {
                _message.value = e.message
            }
        }
    }

    private fun replaceLogs(itemId: String, transform: (List<SetLog>) -> List<SetLog>) {
        val ready = _state.value as? Loadable.Ready ?: return
        _state.value = Loadable.Ready(
            ready.value.copy(
                items = ready.value.items.map { item ->
                    if (item.id == itemId) {
                        item.copy(logs = transform(item.logs).sortedBy { it.setNumber })
                    } else {
                        item
                    }
                },
            ),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutDetailScreen(
    workoutId: String,
    onBack: () -> Unit,
    onChanged: () -> Unit,
    viewModel: WorkoutDetailViewModel = hiltViewModel(),
) {
    LaunchedEffect(workoutId) { viewModel.load(workoutId) }
    val state by viewModel.state.collectAsState()
    val message by viewModel.message.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    var showCompleteDialog by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(message) {
        message?.let {
            snackbar.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text("Тренировка") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
    ) { padding ->
        LoadableBox(
            state,
            onRetry = { viewModel.load(workoutId) },
        ) { detail ->
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) {
                                Text(
                                    detail.workout.title ?: "Тренировка",
                                    style = MaterialTheme.typography.headlineMedium,
                                )
                                Text(
                                    formatDate(detail.workout.date),
                                    color = LocalExtraColors.current.mutedForeground,
                                    style = MaterialTheme.typography.bodySmall,
                                )
                            }
                            StatusChip(detail.workout.status)
                        }
                        detail.workout.trainerComment?.let {
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "Тренер: $it",
                                style = MaterialTheme.typography.bodySmall,
                                color = LocalExtraColors.current.mutedForeground,
                            )
                        }
                    }
                }

                items(detail.items.sortedBy { it.order }, key = { it.id }) { item ->
                    ExerciseCard(
                        item = item,
                        editable = detail.workout.status == "assigned",
                        onLog = { setNumber, weight, reps ->
                            viewModel.logSet(item, setNumber, weight, reps)
                        },
                        onRemove = { setNumber -> viewModel.removeSet(item, setNumber) },
                    )
                }

                if (detail.workout.status == "assigned") {
                    item {
                        Button(
                            onClick = { showCompleteDialog = true },
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) {
                            Text("Завершить тренировку")
                        }
                    }
                }
            }
        }
    }

    if (showCompleteDialog) {
        CompleteDialog(
            onDismiss = { showCompleteDialog = false },
            onConfirm = { feeling, comment ->
                showCompleteDialog = false
                viewModel.complete(feeling, comment) { onChanged() }
            },
        )
    }
}

/** «90 сек» / «2 мин» / «1.5 мин» → секунды; нераспознанное = нет таймера. */
fun parseRestSeconds(rest: String?): Int? {
    rest ?: return null
    val num = Regex("""\d+([.,]\d+)?""").find(rest)?.value
        ?.replace(',', '.')?.toDoubleOrNull() ?: return null
    val minutes = rest.contains("мин", ignoreCase = true) || rest.contains("min", ignoreCase = true)
    return (if (minutes) num * 60 else num).toInt().coerceIn(5, 3600)
}

@Composable
private fun ExerciseCard(
    item: WorkoutItem,
    editable: Boolean,
    onLog: (setNumber: Int, weight: Double?, reps: Int?) -> Unit,
    onRemove: (setNumber: Int) -> Unit,
) {
    // Таймер отдыха: свой на упражнение (как RestTimer веба), стартует после отметки подхода.
    var restLeft by rememberSaveable(item.id) { mutableStateOf(0) }
    var restRun by rememberSaveable(item.id) { mutableStateOf(0) }
    LaunchedEffect(restRun) {
        while (restLeft > 0) {
            kotlinx.coroutines.delay(1000)
            restLeft -= 1
        }
    }
    val restSeconds = parseRestSeconds(item.rest)

    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(16.dp)) {
            item.groupKey?.let {
                Text(
                    when (item.groupType) {
                        "triset" -> "Трисет $it"
                        "circuit" -> "Круг $it"
                        else -> "Суперсет $it"
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
                Spacer(Modifier.height(4.dp))
            }
            Text(item.exercise.name, style = MaterialTheme.typography.titleMedium)
            val plan = listOfNotNull(
                item.sets?.let { "$it подх." },
                item.reps?.let { "$it повт." },
                item.weight,
                item.rest?.let { "отдых $it" },
            ).joinToString(" · ")
            if (plan.isNotEmpty()) {
                Text(
                    plan,
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
            item.comment?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }

            if (restLeft > 0) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "Отдых: %d:%02d".format(restLeft / 60, restLeft % 60),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(Modifier.width(12.dp))
                    TextButton(onClick = { restLeft = 0 }) { Text("Пропустить") }
                }
            }

            Spacer(Modifier.height(10.dp))
            val setCount = maxOf(item.sets ?: 0, item.logs.maxOfOrNull { it.setNumber } ?: 0, 1)
            for (setNumber in 1..setCount) {
                SetRow(
                    item = item,
                    setNumber = setNumber,
                    log = item.logs.find { it.setNumber == setNumber },
                    editable = editable,
                    onLog = { set, weight, reps ->
                        onLog(set, weight, reps)
                        if (restSeconds != null) {
                            restLeft = restSeconds
                            restRun += 1
                        }
                    },
                    onRemove = onRemove,
                )
            }
        }
    }
}

@Composable
private fun SetRow(
    item: WorkoutItem,
    setNumber: Int,
    log: SetLog?,
    editable: Boolean,
    onLog: (setNumber: Int, weight: Double?, reps: Int?) -> Unit,
    onRemove: (setNumber: Int) -> Unit,
) {
    var weight by rememberSaveable(item.id, setNumber, log?.id) {
        mutableStateOf(log?.weight?.let { fmt(it) } ?: "")
    }
    var reps by rememberSaveable(item.id, setNumber, log?.id) {
        mutableStateOf(log?.reps?.toString() ?: "")
    }
    val done = log != null

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
    ) {
        Text(
            "$setNumber",
            style = MaterialTheme.typography.labelMedium,
            color = LocalExtraColors.current.mutedForeground,
            modifier = Modifier.width(20.dp),
        )
        OutlinedTextField(
            value = weight,
            onValueChange = { weight = it },
            label = { Text("Вес") },
            singleLine = true,
            enabled = editable && !done,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.weight(1f),
        )
        Spacer(Modifier.width(8.dp))
        OutlinedTextField(
            value = reps,
            onValueChange = { reps = it },
            label = { Text("Повт.") },
            singleLine = true,
            enabled = editable && !done,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.weight(1f),
        )
        Spacer(Modifier.width(8.dp))
        FilledIconToggleButton(
            checked = done,
            enabled = editable,
            colors = androidx.compose.material3.IconButtonDefaults.filledIconToggleButtonColors(
                containerColor = LocalExtraColors.current.input,
                contentColor = LocalExtraColors.current.mutedForeground,
                checkedContainerColor = MaterialTheme.colorScheme.primary,
                checkedContentColor = MaterialTheme.colorScheme.onPrimary,
            ),
            onCheckedChange = { checked ->
                if (checked) {
                    onLog(setNumber, weight.replace(',', '.').toDoubleOrNull(), reps.toIntOrNull())
                } else {
                    onRemove(setNumber)
                }
            },
        ) {
            Icon(
                if (done) Icons.Default.Check else Icons.Default.RadioButtonUnchecked,
                contentDescription = "Подход $setNumber выполнен",
            )
        }
    }
}

private fun fmt(value: Double): String =
    if (value % 1.0 == 0.0) value.toInt().toString() else value.toString()

private val FEELINGS = listOf(
    "easy" to "Легко",
    "moderate" to "Нормально",
    "hard" to "Тяжело",
    "very_hard" to "Очень тяжело",
)

@Composable
private fun CompleteDialog(
    onDismiss: () -> Unit,
    onConfirm: (feeling: String?, comment: String?) -> Unit,
) {
    var feeling by rememberSaveable { mutableStateOf<String?>(null) }
    var comment by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Завершить тренировку") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Как прошла тренировка?")
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FEELINGS.take(2).forEach { (value, label) ->
                        FilterChip(
                            selected = feeling == value,
                            onClick = { feeling = if (feeling == value) null else value },
                            label = { Text(label) },
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FEELINGS.drop(2).forEach { (value, label) ->
                        FilterChip(
                            selected = feeling == value,
                            onClick = { feeling = if (feeling == value) null else value },
                            label = { Text(label) },
                        )
                    }
                }
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Комментарий тренеру") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            Button(onClick = { onConfirm(feeling, comment) }) { Text("Завершить") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Отмена") }
        },
    )
}
