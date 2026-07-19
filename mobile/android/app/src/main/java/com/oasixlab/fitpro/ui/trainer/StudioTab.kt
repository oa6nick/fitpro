package com.oasixlab.fitpro.ui.trainer

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.UploadRepository
import com.oasixlab.fitpro.data.api.Exercise
import com.oasixlab.fitpro.data.api.ExerciseUpsertRequest
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.HabitRequest
import com.oasixlab.fitpro.data.api.AssignHabitRequest
import com.oasixlab.fitpro.data.api.HabitTask
import com.oasixlab.fitpro.data.api.KnowledgeCreateRequest
import com.oasixlab.fitpro.data.api.KnowledgeItem
import com.oasixlab.fitpro.data.api.NewReportField
import com.oasixlab.fitpro.data.api.ReportFormCreateRequest
import com.oasixlab.fitpro.data.api.ReportFormWithFields
import com.oasixlab.fitpro.data.api.TemplateDetailResponse
import com.oasixlab.fitpro.data.api.TemplateUpsertRequest
import com.oasixlab.fitpro.data.api.TrainerClient
import com.oasixlab.fitpro.data.api.WorkoutItemDraft
import com.oasixlab.fitpro.data.api.WorkoutTemplate
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.TabHeader
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** Русские подписи категорий/типов материалов (в KnowledgeTab клиента они приватные). */
val KNOWLEDGE_CATEGORY_LABELS = mapOf(
    "nutrition" to "Питание",
    "training" to "Тренинг",
    "measurements" to "Замеры",
    "recovery" to "Восстановление",
)

val KNOWLEDGE_TYPE_LABELS = mapOf(
    "pdf" to "PDF",
    "video" to "Видео",
    "checklist" to "Чек-лист",
)

private val FIELD_TYPE_LABELS = mapOf(
    "number" to "Число",
    "text" to "Текст",
    "photo" to "Фото",
    "select" to "Выбор",
)

@HiltViewModel
class StudioViewModel @Inject constructor(
    private val api: FitProApi,
    private val uploads: UploadRepository,
) : ViewModel() {
    private val _exercises = MutableStateFlow<Loadable<List<Exercise>>>(Loadable.Loading)
    val exercises: StateFlow<Loadable<List<Exercise>>> = _exercises

    private val _templates = MutableStateFlow<Loadable<List<WorkoutTemplate>>>(Loadable.Loading)
    val templates: StateFlow<Loadable<List<WorkoutTemplate>>> = _templates

    private val _habits = MutableStateFlow<Loadable<List<HabitTask>>>(Loadable.Loading)
    val habits: StateFlow<Loadable<List<HabitTask>>> = _habits

    private val _knowledge = MutableStateFlow<Loadable<List<KnowledgeItem>>>(Loadable.Loading)
    val knowledge: StateFlow<Loadable<List<KnowledgeItem>>> = _knowledge

    private val _forms = MutableStateFlow<Loadable<List<ReportFormWithFields>>>(Loadable.Loading)
    val forms: StateFlow<Loadable<List<ReportFormWithFields>>> = _forms

    private val _templateDetail = MutableStateFlow<Loadable<TemplateDetailResponse>>(Loadable.Loading)
    val templateDetail: StateFlow<Loadable<TemplateDetailResponse>> = _templateDetail

    /** Клиенты — для диалога «Назначить привычку». */
    val clients = MutableStateFlow<List<TrainerClient>>(emptyList())

    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)

    /** Состояние загрузки файла материала. */
    val uploading = MutableStateFlow(false)
    val uploadedUrl = MutableStateFlow<String?>(null)

    init {
        refreshAll()
    }

    fun refreshAll() {
        refreshExercises()
        refreshTemplates()
        refreshHabits()
        refreshKnowledge()
        refreshForms()
        viewModelScope.launch {
            clients.value =
                runCatching { apiCall { api.trainerClients() }.clients }.getOrDefault(emptyList())
        }
    }

    private fun <T> load(
        flow: MutableStateFlow<Loadable<T>>,
        fallback: String,
        block: suspend () -> T,
    ) {
        flow.value = Loadable.Loading
        viewModelScope.launch {
            flow.value = try {
                Loadable.Ready(block())
            } catch (e: Exception) {
                Loadable.Error(e.message ?: fallback)
            }
        }
    }

    fun refreshExercises() =
        load(_exercises, "Не удалось загрузить упражнения") { apiCall { api.exercises() }.exercises }

    fun refreshTemplates() =
        load(_templates, "Не удалось загрузить шаблоны") { apiCall { api.templates() }.templates }

    fun refreshHabits() =
        load(_habits, "Не удалось загрузить привычки") { apiCall { api.habits() }.habits }

    fun refreshKnowledge() =
        load(_knowledge, "Не удалось загрузить материалы") { apiCall { api.knowledgeAdmin() }.items }

    fun refreshForms() =
        load(_forms, "Не удалось загрузить формы") { apiCall { api.reportForms() }.forms }

    fun loadTemplateDetail(id: String) =
        load(_templateDetail, "Не удалось загрузить шаблон") { apiCall { api.template(id) } }

    /** Общий раннер действий: busy/error + колбэк успеха. */
    private fun action(block: suspend () -> Unit, onDone: () -> Unit) {
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                block()
                onDone()
            } catch (e: Exception) {
                error.value = e.message
            } finally {
                busy.value = false
            }
        }
    }

    fun saveExercise(id: String?, request: ExerciseUpsertRequest, onDone: () -> Unit) = action({
        apiCall {
            if (id == null) api.createExercise(request) else api.updateExercise(id, request)
        }
        refreshExercises()
    }, onDone)

    fun deleteExercise(id: String, onDone: () -> Unit = {}) = action({
        apiCall { api.deleteExercise(id) }
        refreshExercises()
    }, onDone)

    fun saveTemplate(id: String?, request: TemplateUpsertRequest, onDone: () -> Unit) = action({
        apiCall {
            if (id == null) api.createTemplate(request) else api.updateTemplate(id, request)
        }
        refreshTemplates()
    }, onDone)

    fun deleteTemplate(id: String, onDone: () -> Unit = {}) = action({
        apiCall { api.deleteTemplate(id) }
        refreshTemplates()
    }, onDone)

    fun createHabit(title: String, onDone: () -> Unit) = action({
        apiCall { api.createHabit(HabitRequest(title)) }
        refreshHabits()
    }, onDone)

    fun deleteHabit(id: String, onDone: () -> Unit = {}) = action({
        apiCall { api.deleteHabit(id) }
        refreshHabits()
    }, onDone)

    /** weekStart не передаём — сервер возьмёт текущую неделю. */
    fun assignHabit(clientId: String, habitTaskId: String, onDone: () -> Unit) = action({
        apiCall { api.assignHabit(AssignHabitRequest(clientId = clientId, habitTaskId = habitTaskId)) }
    }, onDone)

    fun createKnowledge(request: KnowledgeCreateRequest, onDone: () -> Unit) = action({
        apiCall { api.createKnowledge(request) }
        refreshKnowledge()
    }, onDone)

    fun deleteKnowledge(id: String, onDone: () -> Unit = {}) = action({
        apiCall { api.deleteKnowledge(id) }
        refreshKnowledge()
    }, onDone)

    fun createForm(request: ReportFormCreateRequest, onDone: () -> Unit) = action({
        apiCall { api.createReportForm(request) }
        refreshForms()
    }, onDone)

    fun deleteForm(id: String, onDone: () -> Unit = {}) = action({
        apiCall { api.deleteReportForm(id) }
        refreshForms()
    }, onDone)

    fun uploadFile(uri: android.net.Uri) {
        uploading.value = true
        viewModelScope.launch {
            try {
                uploadedUrl.value = uploads.uploadFile(uri)
            } catch (e: Exception) {
                error.value = e.message ?: "Не удалось загрузить файл"
            } finally {
                uploading.value = false
            }
        }
    }

    fun resetUpload() {
        uploadedUrl.value = null
        error.value = null
    }
}

/* ---------------- Строки конструктора тренировки (общие с назначением) ---------------- */

/** Черновик строки упражнения в редакторе шаблона/назначения. */
class DraftRow(val exerciseId: String) {
    var sets by mutableStateOf("")
    var reps by mutableStateOf("")
    var weight by mutableStateOf("")
    var rest by mutableStateOf("")
    var comment by mutableStateOf("")
    var groupKey by mutableStateOf("")

    fun toDraft(order: Int): WorkoutItemDraft {
        val group = groupKey.trim()
        return WorkoutItemDraft(
            exerciseId = exerciseId,
            order = order,
            sets = sets.trim().toIntOrNull(),
            reps = reps.trim().ifEmpty { null },
            weight = weight.trim().ifEmpty { null },
            rest = rest.trim().ifEmpty { null },
            comment = comment.trim().ifEmpty { null },
            groupKey = group.ifEmpty { null },
            groupType = if (group.isEmpty()) null else "superset",
        )
    }
}

/** Редактор списка строк упражнений — используется в шаблонах и назначении тренировки. */
@Composable
fun WorkoutRowsEditor(rows: SnapshotStateList<DraftRow>, exercises: List<Exercise>) {
    var showPicker by remember { mutableStateOf(false) }
    val extra = LocalExtraColors.current

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        rows.forEachIndexed { index, row ->
            Card(
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "${index + 1}. " +
                                (exercises.find { it.id == row.exerciseId }?.name ?: "Упражнение"),
                            style = MaterialTheme.typography.titleSmall,
                            modifier = Modifier.weight(1f),
                        )
                        IconButton(onClick = { rows.remove(row) }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Убрать упражнение",
                                tint = extra.destructiveSoft,
                            )
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = row.sets,
                            onValueChange = { row.sets = it },
                            label = { Text("Подходы") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                        )
                        OutlinedTextField(
                            value = row.reps,
                            onValueChange = { row.reps = it },
                            label = { Text("Повторы") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = row.weight,
                            onValueChange = { row.weight = it },
                            label = { Text("Вес") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                        )
                        OutlinedTextField(
                            value = row.rest,
                            onValueChange = { row.rest = it },
                            label = { Text("Отдых") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    OutlinedTextField(
                        value = row.comment,
                        onValueChange = { row.comment = it },
                        label = { Text("Комментарий") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = row.groupKey,
                        onValueChange = { row.groupKey = it },
                        label = { Text("Группа (суперсет)") },
                        placeholder = { Text("Например: A") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
        OutlinedButton(onClick = { showPicker = true }, modifier = Modifier.fillMaxWidth()) {
            Text("Добавить упражнение")
        }
    }

    if (showPicker) {
        ExercisePickerDialog(
            exercises = exercises,
            onPick = { exercise ->
                rows.add(DraftRow(exercise.id))
                showPicker = false
            },
            onDismiss = { showPicker = false },
        )
    }
}

/** Диалог выбора упражнения из библиотеки — простой список-клик. */
@Composable
fun ExercisePickerDialog(
    exercises: List<Exercise>,
    onPick: (Exercise) -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Выбор упражнения") },
        text = {
            if (exercises.isEmpty()) {
                Text("Сначала добавьте упражнения в разделе «Студия» → «Упражнения»")
            } else {
                LazyColumn(Modifier.heightIn(max = 400.dp)) {
                    items(exercises, key = { it.id }) { exercise ->
                        Column(
                            Modifier
                                .fillMaxWidth()
                                .clickable { onPick(exercise) }
                                .padding(vertical = 10.dp),
                        ) {
                            Text(exercise.name, style = MaterialTheme.typography.bodyLarge)
                            exercise.muscles?.let {
                                Text(
                                    it,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = LocalExtraColors.current.mutedForeground,
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/** Диалог выбора клиента — простой список-клик. */
@Composable
fun ClientPickerDialog(
    clients: List<TrainerClient>,
    onPick: (TrainerClient) -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Выбор клиента") },
        text = {
            if (clients.isEmpty()) {
                Text("Клиентов пока нет")
            } else {
                LazyColumn(Modifier.heightIn(max = 400.dp)) {
                    items(clients, key = { it.id }) { client ->
                        Text(
                            client.name,
                            style = MaterialTheme.typography.bodyLarge,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onPick(client) }
                                .padding(vertical = 10.dp),
                        )
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/** Диалог подтверждения удаления. */
@Composable
fun ConfirmDeleteDialog(text: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Удалить?") },
        text = { Text(text) },
        confirmButton = {
            TextButton(onClick = {
                onConfirm()
                onDismiss()
            }) { Text("Удалить", color = LocalExtraColors.current.destructiveSoft) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/* ---------------- Вкладка «Студия» ---------------- */

@Composable
fun StudioTab(viewModel: StudioViewModel = hiltViewModel()) {
    var segment by rememberSaveable { mutableIntStateOf(0) }
    // "" — новый шаблон, иначе id редактируемого.
    var editedTemplateId by rememberSaveable { mutableStateOf<String?>(null) }

    editedTemplateId?.let { id ->
        BackHandler { editedTemplateId = null }
        TemplateEditorScreen(
            viewModel = viewModel,
            templateId = id.ifEmpty { null },
            onBack = { editedTemplateId = null },
        )
        return
    }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Студия")
        SingleChoiceSegmentedButtonRow(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        ) {
            listOf("Упражнения", "Шаблоны", "Привычки", "Материалы", "Формы")
                .forEachIndexed { index, label ->
                    SegmentedButton(
                        selected = segment == index,
                        onClick = { segment = index },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = 5),
                        icon = {},
                    ) { Text(label, fontSize = 11.sp, maxLines = 1) }
                }
        }
        when (segment) {
            0 -> ExercisesSegment(viewModel)
            1 -> TemplatesSegment(viewModel, onOpenEditor = { editedTemplateId = it ?: "" })
            2 -> HabitsSegment(viewModel)
            3 -> KnowledgeSegment(viewModel)
            else -> FormsSegment(viewModel)
        }
    }
}

/* ---------------- Упражнения ---------------- */

@Composable
private fun ExercisesSegment(viewModel: StudioViewModel) {
    val state by viewModel.exercises.collectAsState()
    // null — диалог закрыт; Exercise? внутри пары: null = создание.
    var showDialogFor by remember { mutableStateOf<Exercise?>(null) }
    var showCreate by remember { mutableStateOf(false) }
    var deleteTarget by remember { mutableStateOf<Exercise?>(null) }
    val extra = LocalExtraColors.current

    LoadableBox(state, onRetry = viewModel::refreshExercises) { exercises ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                OutlinedButton(onClick = { showCreate = true }, modifier = Modifier.fillMaxWidth()) {
                    Text("Добавить упражнение")
                }
            }
            if (exercises.isEmpty()) {
                item {
                    Text(
                        "Библиотека пуста — добавьте первое упражнение",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                }
            }
            items(exercises, key = { it.id }) { exercise ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth().clickable { showDialogFor = exercise },
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 14.dp, top = 6.dp, bottom = 6.dp, end = 4.dp),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(exercise.name, style = MaterialTheme.typography.titleSmall)
                            exercise.muscles?.let {
                                Text(
                                    it,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = extra.mutedForeground,
                                )
                            }
                        }
                        IconButton(onClick = { deleteTarget = exercise }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Удалить",
                                tint = extra.mutedForeground,
                            )
                        }
                    }
                }
            }
        }
    }

    if (showCreate) {
        ExerciseDialog(
            viewModel = viewModel,
            exercise = null,
            onDismiss = { showCreate = false },
        )
    }
    showDialogFor?.let { exercise ->
        ExerciseDialog(
            viewModel = viewModel,
            exercise = exercise,
            onDismiss = { showDialogFor = null },
        )
    }
    deleteTarget?.let { exercise ->
        ConfirmDeleteDialog(
            text = "Упражнение «${exercise.name}» будет удалено из библиотеки.",
            onConfirm = { viewModel.deleteExercise(exercise.id) },
            onDismiss = { deleteTarget = null },
        )
    }
}

@Composable
private fun ExerciseDialog(
    viewModel: StudioViewModel,
    exercise: Exercise?,
    onDismiss: () -> Unit,
) {
    var name by rememberSaveable { mutableStateOf(exercise?.name ?: "") }
    var videoUrl by rememberSaveable { mutableStateOf(exercise?.videoUrl ?: "") }
    var technique by rememberSaveable { mutableStateOf(exercise?.techniqueDescription ?: "") }
    var hints by rememberSaveable { mutableStateOf(exercise?.keyHints ?: "") }
    var mistakes by rememberSaveable { mutableStateOf(exercise?.commonMistakes ?: "") }
    var muscles by rememberSaveable { mutableStateOf(exercise?.muscles ?: "") }
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (exercise == null) "Новое упражнение" else "Упражнение") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.verticalScroll(rememberScrollState()),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Название*") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = videoUrl,
                    onValueChange = { videoUrl = it },
                    label = { Text("Видео-URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = technique,
                    onValueChange = { technique = it },
                    label = { Text("Техника") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = hints,
                    onValueChange = { hints = it },
                    label = { Text("Ключевые подсказки") },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = mistakes,
                    onValueChange = { mistakes = it },
                    label = { Text("Ошибки") },
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = muscles,
                    onValueChange = { muscles = it },
                    label = { Text("Мышцы") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                error?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = LocalExtraColors.current.destructiveSoft,
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !busy && name.trim().isNotEmpty(),
                onClick = {
                    viewModel.saveExercise(
                        exercise?.id,
                        ExerciseUpsertRequest(
                            name = name.trim(),
                            videoUrl = videoUrl.trim().ifEmpty { null },
                            techniqueDescription = technique.trim().ifEmpty { null },
                            keyHints = hints.trim().ifEmpty { null },
                            commonMistakes = mistakes.trim().ifEmpty { null },
                            muscles = muscles.trim().ifEmpty { null },
                        ),
                    ) { onDismiss() }
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/* ---------------- Шаблоны ---------------- */

@Composable
private fun TemplatesSegment(viewModel: StudioViewModel, onOpenEditor: (String?) -> Unit) {
    val state by viewModel.templates.collectAsState()
    var deleteTarget by remember { mutableStateOf<WorkoutTemplate?>(null) }
    val extra = LocalExtraColors.current

    LoadableBox(state, onRetry = viewModel::refreshTemplates) { templates ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                OutlinedButton(onClick = { onOpenEditor(null) }, modifier = Modifier.fillMaxWidth()) {
                    Text("Создать шаблон")
                }
            }
            if (templates.isEmpty()) {
                item {
                    Text(
                        "Шаблонов пока нет",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                }
            }
            items(templates, key = { it.id }) { template ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth().clickable { onOpenEditor(template.id) },
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 14.dp, top = 6.dp, bottom = 6.dp, end = 4.dp),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(template.name, style = MaterialTheme.typography.titleSmall)
                            template.goal?.let {
                                Text(
                                    it,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = extra.mutedForeground,
                                )
                            }
                        }
                        IconButton(onClick = { deleteTarget = template }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Удалить",
                                tint = extra.mutedForeground,
                            )
                        }
                    }
                }
            }
        }
    }

    deleteTarget?.let { template ->
        ConfirmDeleteDialog(
            text = "Шаблон «${template.name}» будет удалён.",
            onConfirm = { viewModel.deleteTemplate(template.id) },
            onDismiss = { deleteTarget = null },
        )
    }
}

/** Полноэкранный редактор шаблона (создание и правка; PUT — полная замена items). */
@Composable
private fun TemplateEditorScreen(
    viewModel: StudioViewModel,
    templateId: String?,
    onBack: () -> Unit,
) {
    val exercisesState by viewModel.exercises.collectAsState()
    val exercises = (exercisesState as? Loadable.Ready)?.value ?: emptyList()
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()

    var name by rememberSaveable { mutableStateOf("") }
    var goal by rememberSaveable { mutableStateOf("") }
    val rows = remember { mutableStateListOf<DraftRow>() }
    // Заполняем поля из деталей ровно один раз (для существующего шаблона).
    var populated by rememberSaveable { mutableStateOf(templateId == null) }

    LaunchedEffect(templateId) {
        if (templateId != null) viewModel.loadTemplateDetail(templateId)
    }
    val detail by viewModel.templateDetail.collectAsState()
    LaunchedEffect(detail, populated) {
        if (populated || templateId == null) return@LaunchedEffect
        val ready = (detail as? Loadable.Ready)?.value ?: return@LaunchedEffect
        if (ready.template.id != templateId) return@LaunchedEffect
        populated = true
        name = ready.template.name
        goal = ready.template.goal ?: ""
        rows.clear()
        ready.items.sortedBy { it.order }.forEach { item ->
            rows.add(
                DraftRow(item.exerciseId).apply {
                    sets = item.sets?.toString() ?: ""
                    reps = item.reps ?: ""
                    weight = item.weight ?: ""
                    rest = item.rest ?: ""
                    comment = item.comment ?: ""
                    groupKey = item.groupKey ?: ""
                },
            )
        }
    }

    Column(Modifier.fillMaxSize()) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 16.dp),
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
            }
            Text(
                if (templateId == null) "Новый шаблон" else "Шаблон",
                style = MaterialTheme.typography.titleLarge,
            )
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Название*") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = goal,
                onValueChange = { goal = it },
                label = { Text("Цель") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            SectionTitle("Упражнения")
            WorkoutRowsEditor(rows, exercises)
            error?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.destructiveSoft,
                )
            }
            Button(
                enabled = !busy && name.trim().isNotEmpty(),
                onClick = {
                    viewModel.saveTemplate(
                        templateId,
                        TemplateUpsertRequest(
                            name = name.trim(),
                            goal = goal.trim().ifEmpty { null },
                            items = rows.mapIndexed { index, row -> row.toDraft(index) },
                        ),
                    ) { onBack() }
                },
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text("Сохранить") }
            Spacer(Modifier.height(8.dp))
        }
    }
}

/* ---------------- Привычки ---------------- */

@Composable
private fun HabitsSegment(viewModel: StudioViewModel) {
    val state by viewModel.habits.collectAsState()
    val clients by viewModel.clients.collectAsState()
    var showAdd by remember { mutableStateOf(false) }
    var assignTarget by remember { mutableStateOf<HabitTask?>(null) }
    var deleteTarget by remember { mutableStateOf<HabitTask?>(null) }
    val extra = LocalExtraColors.current

    LoadableBox(state, onRetry = viewModel::refreshHabits) { habits ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                OutlinedButton(onClick = { showAdd = true }, modifier = Modifier.fillMaxWidth()) {
                    Text("Добавить привычку")
                }
            }
            if (habits.isEmpty()) {
                item {
                    Text(
                        "Привычек пока нет",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                }
            }
            items(habits, key = { it.id }) { habit ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 14.dp, top = 2.dp, bottom = 2.dp, end = 4.dp),
                    ) {
                        Text(
                            habit.title,
                            style = MaterialTheme.typography.titleSmall,
                            modifier = Modifier.weight(1f),
                        )
                        TextButton(onClick = { assignTarget = habit }) { Text("Назначить") }
                        IconButton(onClick = { deleteTarget = habit }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Удалить",
                                tint = extra.mutedForeground,
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAdd) {
        var title by rememberSaveable { mutableStateOf("") }
        val busy by viewModel.busy.collectAsState()
        AlertDialog(
            onDismissRequest = { showAdd = false },
            title = { Text("Новая привычка") },
            text = {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Название*") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                Button(
                    enabled = !busy && title.trim().isNotEmpty(),
                    onClick = { viewModel.createHabit(title.trim()) { showAdd = false } },
                ) { Text("Сохранить") }
            },
            dismissButton = { TextButton(onClick = { showAdd = false }) { Text("Отмена") } },
        )
    }

    assignTarget?.let { habit ->
        ClientPickerDialog(
            clients = clients,
            onPick = { client ->
                viewModel.assignHabit(client.id, habit.id) {}
                assignTarget = null
            },
            onDismiss = { assignTarget = null },
        )
    }

    deleteTarget?.let { habit ->
        ConfirmDeleteDialog(
            text = "Привычка «${habit.title}» будет удалена.",
            onConfirm = { viewModel.deleteHabit(habit.id) },
            onDismiss = { deleteTarget = null },
        )
    }
}

/* ---------------- Материалы ---------------- */

@Composable
private fun KnowledgeSegment(viewModel: StudioViewModel) {
    val state by viewModel.knowledge.collectAsState()
    var showAdd by remember { mutableStateOf(false) }
    var deleteTarget by remember { mutableStateOf<KnowledgeItem?>(null) }
    val extra = LocalExtraColors.current

    LoadableBox(state, onRetry = viewModel::refreshKnowledge) { items ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                OutlinedButton(
                    onClick = {
                        viewModel.resetUpload()
                        showAdd = true
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Добавить материал") }
            }
            if (items.isEmpty()) {
                item {
                    Text(
                        "Материалов пока нет",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                }
            }
            items(items, key = { it.id }) { item ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 14.dp, top = 6.dp, bottom = 6.dp, end = 4.dp),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(item.title, style = MaterialTheme.typography.titleSmall)
                            Text(
                                "${KNOWLEDGE_CATEGORY_LABELS[item.category] ?: item.category} · " +
                                    "${KNOWLEDGE_TYPE_LABELS[item.type] ?: item.type} · " +
                                    "неделя ${item.unlockWeek}",
                                style = MaterialTheme.typography.bodySmall,
                                color = extra.mutedForeground,
                            )
                        }
                        IconButton(onClick = { deleteTarget = item }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Удалить",
                                tint = extra.mutedForeground,
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAdd) {
        KnowledgeCreateDialog(viewModel, onDismiss = { showAdd = false })
    }
    deleteTarget?.let { item ->
        ConfirmDeleteDialog(
            text = "Материал «${item.title}» будет удалён.",
            onConfirm = { viewModel.deleteKnowledge(item.id) },
            onDismiss = { deleteTarget = null },
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun KnowledgeCreateDialog(viewModel: StudioViewModel, onDismiss: () -> Unit) {
    var title by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("nutrition") }
    var type by rememberSaveable { mutableStateOf("pdf") }
    var unlockWeek by rememberSaveable { mutableStateOf("1") }
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()
    val uploading by viewModel.uploading.collectAsState()
    val uploadedUrl by viewModel.uploadedUrl.collectAsState()

    val pickFile = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let(viewModel::uploadFile)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Новый материал") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.verticalScroll(rememberScrollState()),
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Название*") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text("Категория", style = MaterialTheme.typography.labelMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    KNOWLEDGE_CATEGORY_LABELS.forEach { (key, label) ->
                        FilterChip(
                            selected = category == key,
                            onClick = { category = key },
                            label = { Text(label) },
                        )
                    }
                }
                Text("Тип", style = MaterialTheme.typography.labelMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    KNOWLEDGE_TYPE_LABELS.forEach { (key, label) ->
                        FilterChip(
                            selected = type == key,
                            onClick = { type = key },
                            label = { Text(label) },
                        )
                    }
                }
                OutlinedTextField(
                    value = unlockWeek,
                    onValueChange = { unlockWeek = it },
                    label = { Text("Неделя открытия") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedButton(
                    onClick = { pickFile.launch("*/*") },
                    enabled = !uploading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (uploading) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                    } else {
                        Icon(
                            Icons.Default.AttachFile,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    Text(if (uploadedUrl != null) "Файл прикреплён ✓" else "Прикрепить файл")
                }
                error?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = LocalExtraColors.current.destructiveSoft,
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = !busy && !uploading && title.trim().isNotEmpty(),
                onClick = {
                    viewModel.createKnowledge(
                        KnowledgeCreateRequest(
                            category = category,
                            title = title.trim(),
                            type = type,
                            fileUrl = uploadedUrl,
                            unlockWeek = unlockWeek.trim().toIntOrNull() ?: 1,
                        ),
                    ) { onDismiss() }
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/* ---------------- Формы отчётов ---------------- */

@Composable
private fun FormsSegment(viewModel: StudioViewModel) {
    val state by viewModel.forms.collectAsState()
    var showCreate by remember { mutableStateOf(false) }
    var deleteTarget by remember { mutableStateOf<ReportFormWithFields?>(null) }
    val extra = LocalExtraColors.current

    LoadableBox(state, onRetry = viewModel::refreshForms) { forms ->
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                OutlinedButton(onClick = { showCreate = true }, modifier = Modifier.fillMaxWidth()) {
                    Text("Создать форму")
                }
            }
            if (forms.isEmpty()) {
                item {
                    Text(
                        "Форм пока нет",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                }
            }
            items(forms, key = { it.id }) { form ->
                Card(
                    shape = MaterialTheme.shapes.medium,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(start = 14.dp, top = 6.dp, bottom = 6.dp, end = 4.dp),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(form.name, style = MaterialTheme.typography.titleSmall)
                            Text(
                                "Полей: ${form.fields.size}",
                                style = MaterialTheme.typography.bodySmall,
                                color = extra.mutedForeground,
                            )
                        }
                        IconButton(onClick = { deleteTarget = form }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Удалить",
                                tint = extra.mutedForeground,
                            )
                        }
                    }
                }
            }
        }
    }

    if (showCreate) {
        FormCreateDialog(viewModel, onDismiss = { showCreate = false })
    }
    deleteTarget?.let { form ->
        ConfirmDeleteDialog(
            text = "Форма «${form.name}» будет удалена.",
            onConfirm = { viewModel.deleteForm(form.id) },
            onDismiss = { deleteTarget = null },
        )
    }
}

/** Черновик поля формы отчёта. */
private class FormFieldDraft {
    var label by mutableStateOf("")
    var type by mutableStateOf("number")
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FormCreateDialog(viewModel: StudioViewModel, onDismiss: () -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    val fields = remember { mutableStateListOf(FormFieldDraft()) }
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()
    val extra = LocalExtraColors.current

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Новая форма отчёта") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.verticalScroll(rememberScrollState()),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Название*") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                fields.forEachIndexed { index, field ->
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = field.label,
                                onValueChange = { field.label = it },
                                label = { Text("Поле ${index + 1}") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                            )
                            IconButton(onClick = { fields.remove(field) }) {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = "Убрать поле",
                                    tint = extra.mutedForeground,
                                )
                            }
                        }
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            FIELD_TYPE_LABELS.forEach { (key, label) ->
                                FilterChip(
                                    selected = field.type == key,
                                    onClick = { field.type = key },
                                    label = { Text(label, fontSize = 11.sp) },
                                )
                            }
                        }
                    }
                }
                OutlinedButton(
                    onClick = { fields.add(FormFieldDraft()) },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Добавить поле") }
                error?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.destructiveSoft,
                    )
                }
            }
        },
        confirmButton = {
            val validFields = fields.filter { it.label.trim().isNotEmpty() }
            Button(
                enabled = !busy && name.trim().isNotEmpty() && validFields.isNotEmpty(),
                onClick = {
                    viewModel.createForm(
                        ReportFormCreateRequest(
                            name = name.trim(),
                            fields = validFields.mapIndexed { index, field ->
                                NewReportField(
                                    label = field.label.trim(),
                                    type = field.type,
                                    order = index,
                                )
                            },
                        ),
                    ) { onDismiss() }
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}
