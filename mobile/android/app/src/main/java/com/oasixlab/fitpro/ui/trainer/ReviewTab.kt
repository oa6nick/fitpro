package com.oasixlab.fitpro.ui.trainer

import androidx.activity.compose.BackHandler
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import com.oasixlab.fitpro.data.api.ReviewWorkoutRequest
import com.oasixlab.fitpro.data.api.SubmissionDetailResponse
import com.oasixlab.fitpro.data.api.TrainerSubmission
import com.oasixlab.fitpro.data.api.UnreviewedWorkout
import com.oasixlab.fitpro.data.api.WorkoutDetailResponse
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.client.absoluteUrl
import com.oasixlab.fitpro.ui.client.EmptyTab
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

val FEELING_LABELS = mapOf(
    "easy" to "легко",
    "moderate" to "нормально",
    "hard" to "тяжело",
    "very_hard" to "очень тяжело",
)

@HiltViewModel
class ReviewViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _diaries = MutableStateFlow<Loadable<List<UnreviewedWorkout>>>(Loadable.Loading)
    val diaries: StateFlow<Loadable<List<UnreviewedWorkout>>> = _diaries

    private val _reports = MutableStateFlow<Loadable<List<TrainerSubmission>>>(Loadable.Loading)
    val reports: StateFlow<Loadable<List<TrainerSubmission>>> = _reports

    private val _workout = MutableStateFlow<Loadable<WorkoutDetailResponse>>(Loadable.Loading)
    val workout: StateFlow<Loadable<WorkoutDetailResponse>> = _workout

    private val _submission = MutableStateFlow<Loadable<SubmissionDetailResponse>>(Loadable.Loading)
    val submission: StateFlow<Loadable<SubmissionDetailResponse>> = _submission

    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)

    init {
        refresh()
    }

    fun refresh() {
        _diaries.value = Loadable.Loading
        _reports.value = Loadable.Loading
        viewModelScope.launch {
            _diaries.value = try {
                // Список непроверенных отдаёт дашборд (отдельного эндпоинта нет).
                Loadable.Ready(apiCall { api.dashboard() }.unreviewed)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить дневники")
            }
            _reports.value = try {
                Loadable.Ready(apiCall { api.trainerSubmissions("awaiting_review") }.submissions)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить отчёты")
            }
        }
    }

    fun loadWorkout(id: String) {
        _workout.value = Loadable.Loading
        viewModelScope.launch {
            _workout.value = try {
                Loadable.Ready(apiCall { api.workout(id) })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить дневник")
            }
        }
    }

    fun reviewWorkout(id: String, comment: String, onDone: () -> Unit) {
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                apiCall {
                    api.reviewWorkout(id, ReviewWorkoutRequest(comment.trim().ifEmpty { null }))
                }
                onDone()
                refresh()
            } catch (e: Exception) {
                error.value = e.message
            } finally {
                busy.value = false
            }
        }
    }

    fun loadSubmission(id: String) {
        _submission.value = Loadable.Loading
        viewModelScope.launch {
            _submission.value = try {
                Loadable.Ready(apiCall { api.submissionDetail(id) })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить отчёт")
            }
        }
    }

    fun reviewSubmission(id: String, onDone: () -> Unit) {
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                apiCall { api.reviewSubmission(id) }
                onDone()
                refresh()
            } catch (e: Exception) {
                error.value = e.message
            } finally {
                busy.value = false
            }
        }
    }
}

/** Вкладка «Проверка»: сегменты «Дневники» (pending-тренировки) и «Отчёты». */
@Composable
fun ReviewTab(viewModel: ReviewViewModel = hiltViewModel()) {
    var segment by rememberSaveable { mutableIntStateOf(0) }
    var openedWorkout by rememberSaveable { mutableStateOf<String?>(null) }
    var openedSubmission by rememberSaveable { mutableStateOf<String?>(null) }

    openedWorkout?.let { id ->
        BackHandler { openedWorkout = null }
        WorkoutReviewScreen(viewModel, id, onBack = { openedWorkout = null })
        return
    }
    openedSubmission?.let { id ->
        BackHandler { openedSubmission = null }
        SubmissionReviewScreen(viewModel, id, onBack = { openedSubmission = null })
        return
    }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Проверка")
        SingleChoiceSegmentedButtonRow(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        ) {
            listOf("Дневники", "Отчёты").forEachIndexed { index, label ->
                SegmentedButton(
                    selected = segment == index,
                    onClick = { segment = index },
                    shape = SegmentedButtonDefaults.itemShape(index = index, count = 2),
                ) { Text(label) }
            }
        }
        if (segment == 0) {
            val diaries by viewModel.diaries.collectAsState()
            LoadableBox(diaries, onRetry = viewModel::refresh) { list ->
                if (list.isEmpty()) {
                    EmptyTab("Всё проверено", "Новые завершённые тренировки появятся здесь")
                    return@LoadableBox
                }
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(list, key = { it.id }) { w ->
                        ListCard(
                            title = "${w.clientName} — ${w.title ?: "Тренировка"}",
                            subtitle = formatDate(w.date),
                            onClick = { openedWorkout = w.id },
                        )
                    }
                }
            }
        } else {
            val reports by viewModel.reports.collectAsState()
            LoadableBox(reports, onRetry = viewModel::refresh) { list ->
                if (list.isEmpty()) {
                    EmptyTab("Отчётов на проверке нет", "Сданные клиентами отчёты появятся здесь")
                    return@LoadableBox
                }
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(list, key = { it.id }) { s ->
                        ListCard(
                            title = s.clientName,
                            subtitle = "Неделя с ${formatDate(s.weekStart)}",
                            onClick = { openedSubmission = s.id },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ReviewHeader(title: String, onBack: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 16.dp),
    ) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
        }
        Text(title, style = MaterialTheme.typography.titleLarge)
    }
}

@Composable
private fun WorkoutReviewScreen(viewModel: ReviewViewModel, workoutId: String, onBack: () -> Unit) {
    LaunchedEffect(workoutId) { viewModel.loadWorkout(workoutId) }
    val state by viewModel.workout.collectAsState()
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()
    var comment by rememberSaveable { mutableStateOf("") }
    val extra = LocalExtraColors.current

    Column(Modifier.fillMaxSize()) {
        ReviewHeader("Дневник клиента", onBack)
        LoadableBox(state, onRetry = { viewModel.loadWorkout(workoutId) }) { detail ->
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Column {
                        Text(
                            detail.workout.title ?: "Тренировка",
                            style = MaterialTheme.typography.headlineMedium,
                        )
                        Text(
                            listOfNotNull(
                                formatDate(detail.workout.date),
                                detail.workout.tonnage?.let { "тоннаж ${it.toInt()} кг" },
                                detail.workout.clientFeeling?.let {
                                    "самочувствие: ${FEELING_LABELS[it] ?: it}"
                                },
                            ).joinToString(" · "),
                            style = MaterialTheme.typography.bodySmall,
                            color = extra.mutedForeground,
                        )
                        detail.workout.clientComment?.let {
                            Spacer(Modifier.height(4.dp))
                            Text("Клиент: $it", style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }

                items(detail.items.sortedBy { it.order }, key = { it.id }) { item ->
                    Card(
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text(item.exercise.name, style = MaterialTheme.typography.titleSmall)
                            val plan = listOfNotNull(
                                item.sets?.let { "$it подх." },
                                item.reps?.let { "$it повт." },
                                item.weight,
                            ).joinToString(" · ")
                            if (plan.isNotEmpty()) {
                                Text(
                                    "План: $plan",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = extra.mutedForeground,
                                )
                            }
                            Spacer(Modifier.height(4.dp))
                            if (item.logs.isEmpty()) {
                                Text(
                                    "Подходы не записаны",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = extra.warning,
                                )
                            } else {
                                item.logs.forEach { log ->
                                    Text(
                                        "Подход ${log.setNumber}: " +
                                            listOfNotNull(
                                                log.weight?.let { "$it кг" },
                                                log.reps?.let { "$it повт." },
                                            ).joinToString(" × ").ifEmpty { "✓" },
                                        style = MaterialTheme.typography.bodySmall,
                                    )
                                }
                            }
                        }
                    }
                }

                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = comment,
                            onValueChange = { comment = it },
                            label = { Text("Комментарий клиенту") },
                            minLines = 2,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        error?.let {
                            Text(
                                it,
                                style = MaterialTheme.typography.bodySmall,
                                color = extra.destructiveSoft,
                            )
                        }
                        Button(
                            onClick = { viewModel.reviewWorkout(workoutId, comment, onBack) },
                            enabled = !busy,
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("Проверено") }
                    }
                }
            }
        }
    }
}

@Composable
private fun SubmissionReviewScreen(
    viewModel: ReviewViewModel,
    submissionId: String,
    onBack: () -> Unit,
) {
    LaunchedEffect(submissionId) { viewModel.loadSubmission(submissionId) }
    val state by viewModel.submission.collectAsState()
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()
    val extra = LocalExtraColors.current

    Column(Modifier.fillMaxSize()) {
        ReviewHeader("Отчёт клиента", onBack)
        LoadableBox(state, onRetry = { viewModel.loadSubmission(submissionId) }) { detail ->
            val answers = detail.answers.associateBy { it.fieldId }
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Text(
                        "Неделя с ${formatDate(detail.submission.weekStart)}",
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                items(detail.fields.sortedBy { it.order }, key = { it.id }) { field ->
                    val value = answers[field.id]?.value
                    Card(
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text(
                                field.label,
                                style = MaterialTheme.typography.labelMedium,
                                color = extra.mutedForeground,
                            )
                            if (field.type == "photo" && !value.isNullOrBlank()) {
                                coil.compose.AsyncImage(
                                    model = absoluteUrl(value),
                                    contentDescription = field.label,
                                    modifier = Modifier.fillMaxWidth().height(180.dp),
                                )
                            } else {
                                Text(
                                    value?.takeIf { it.isNotBlank() } ?: "—",
                                    style = MaterialTheme.typography.bodyMedium,
                                )
                            }
                        }
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        error?.let {
                            Text(
                                it,
                                style = MaterialTheme.typography.bodySmall,
                                color = extra.destructiveSoft,
                            )
                        }
                        Button(
                            onClick = { viewModel.reviewSubmission(submissionId, onBack) },
                            enabled = !busy,
                            shape = MaterialTheme.shapes.medium,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                        ) { Text("Проверено") }
                    }
                }
            }
        }
    }
}
