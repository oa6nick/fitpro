package com.oasixlab.fitpro.ui.trainer

import android.content.Intent
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.UploadRepository
import com.oasixlab.fitpro.data.api.ClientDetailResponse
import com.oasixlab.fitpro.data.api.ClientProfile
import com.oasixlab.fitpro.data.api.ClientUpsertRequest
import com.oasixlab.fitpro.data.api.CreateMeasurementRequest
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.FunnelStatusRequest
import com.oasixlab.fitpro.data.api.NoteRequest
import com.oasixlab.fitpro.data.api.TrainerClient
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.client.ClientProfileEditor
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
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class TrainerClientsViewModel @Inject constructor(
    private val api: FitProApi,
    private val uploads: UploadRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<List<TrainerClient>>>(Loadable.Loading)
    val state: StateFlow<Loadable<List<TrainerClient>>> = _state

    private val _detail = MutableStateFlow<Loadable<ClientDetailResponse>>(Loadable.Loading)
    val detail: StateFlow<Loadable<ClientDetailResponse>> = _detail

    val busy = MutableStateFlow(false)
    val actionError = MutableStateFlow<String?>(null)

    /** Фото формы замера (тренер добавляет замер за клиента). */
    val photoBefore = MutableStateFlow<String?>(null)
    val photoAfter = MutableStateFlow<String?>(null)
    val uploadingBefore = MutableStateFlow(false)
    val uploadingAfter = MutableStateFlow(false)

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

    fun clearError() {
        actionError.value = null
    }

    /** Общий раннер действий: busy/actionError + колбэк успеха.
     * ApiException (в т.ч. 402 — лимит тарифа) даёт русский текст сервера в actionError. */
    private fun action(block: suspend () -> Unit, onDone: () -> Unit) {
        busy.value = true
        actionError.value = null
        viewModelScope.launch {
            try {
                block()
                onDone()
            } catch (e: Exception) {
                actionError.value = e.message
            } finally {
                busy.value = false
            }
        }
    }

    fun createClient(request: ClientUpsertRequest, onDone: () -> Unit) = action({
        apiCall { api.createClient(request) }
        refresh()
    }, onDone)

    fun updateClient(id: String, request: ClientUpsertRequest, onDone: () -> Unit) = action({
        apiCall { api.updateClient(id, request) }
        loadDetail(id)
        refresh()
    }, onDone)

    fun setStatus(id: String, status: String, onDone: () -> Unit) = action({
        apiCall { api.setClientStatus(id, FunnelStatusRequest(status)) }
        loadDetail(id)
        refresh()
    }, onDone)

    fun addNote(id: String, text: String, onDone: () -> Unit) = action({
        apiCall { api.addNote(id, NoteRequest(text)) }
        loadDetail(id)
    }, onDone)

    fun saveProfile(id: String, profile: ClientProfile, onDone: () -> Unit) = action({
        apiCall { api.updateClientProfile(id, profile) }
        loadDetail(id)
    }, onDone)

    fun addMeasurement(request: CreateMeasurementRequest, onDone: () -> Unit) = action({
        apiCall { api.addMeasurement(request) }
        resetMeasurementForm()
        request.clientId?.let { loadDetail(it) }
    }, onDone)

    fun deleteClient(id: String, onDone: () -> Unit) = action({
        apiCall { api.deleteClient(id) }
        refresh()
    }, onDone)

    fun createInvite(id: String, onLink: (String) -> Unit) = action({
        val link = apiCall { api.createInvite(id) }.link
        onLink(link)
    }, onDone = {})

    fun uploadPhoto(uri: android.net.Uri, isBefore: Boolean) {
        val flag = if (isBefore) uploadingBefore else uploadingAfter
        val target = if (isBefore) photoBefore else photoAfter
        flag.value = true
        viewModelScope.launch {
            try {
                target.value = uploads.uploadImage(uri)
            } catch (e: Exception) {
                actionError.value = e.message ?: "Не удалось загрузить фото"
            } finally {
                flag.value = false
            }
        }
    }

    fun resetMeasurementForm() {
        photoBefore.value = null
        photoAfter.value = null
        actionError.value = null
    }
}

@Composable
fun ClientsTab(viewModel: TrainerClientsViewModel = hiltViewModel()) {
    var openedId by rememberSaveable { mutableStateOf<String?>(null) }
    var showCreate by rememberSaveable { mutableStateOf(false) }

    openedId?.let { id ->
        BackHandler { openedId = null }
        ClientDetailScreen(viewModel, id, onBack = { openedId = null })
        return
    }

    val state by viewModel.state.collectAsState()
    Column(Modifier.fillMaxSize()) {
        TabHeader("Клиенты")
        Box(Modifier.fillMaxSize()) {
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
            FloatingActionButton(
                onClick = {
                    viewModel.clearError()
                    showCreate = true
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
            ) {
                Icon(Icons.Default.Add, contentDescription = "Добавить клиента")
            }
        }
    }

    if (showCreate) {
        ClientUpsertDialog(
            title = "Новый клиент",
            initial = null,
            viewModel = viewModel,
            onSave = { request -> viewModel.createClient(request) { showCreate = false } },
            onDismiss = { showCreate = false },
        )
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
    val busy by viewModel.busy.collectAsState()
    val actionError by viewModel.actionError.collectAsState()
    val context = LocalContext.current

    // Внутренние уровни: назначение тренировки и анкета.
    var innerScreen by rememberSaveable { mutableStateOf<String?>(null) }
    // Открытый диалог: status | note | measure | edit | delete.
    var dialog by rememberSaveable { mutableStateOf<String?>(null) }

    val clientName = (state as? Loadable.Ready)?.value?.client?.name ?: ""

    when (innerScreen) {
        "assign" -> {
            BackHandler { innerScreen = null }
            AssignWorkoutScreen(
                clientId = clientId,
                clientName = clientName,
                onBack = { innerScreen = null },
                onAssigned = {
                    innerScreen = null
                    viewModel.loadDetail(clientId)
                },
            )
            return
        }

        "profile" -> {
            BackHandler { innerScreen = null }
            Column(Modifier.fillMaxSize()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 16.dp),
                ) {
                    IconButton(onClick = { innerScreen = null }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
                    }
                    Text("Анкета клиента", style = MaterialTheme.typography.titleLarge)
                }
                ClientProfileEditor(
                    busy = busy,
                    error = actionError,
                    onSave = { profile ->
                        viewModel.saveProfile(clientId, profile) { innerScreen = null }
                    },
                )
            }
            return
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

                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        actionError?.let {
                            Text(
                                it,
                                style = MaterialTheme.typography.bodySmall,
                                color = LocalExtraColors.current.destructiveSoft,
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { innerScreen = "assign" },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Назначить тренировку") }
                            OutlinedButton(
                                enabled = !busy,
                                onClick = {
                                    viewModel.createInvite(clientId) { link ->
                                        val send = Intent(Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(Intent.EXTRA_TEXT, link)
                                        }
                                        context.startActivity(
                                            Intent.createChooser(send, "Отправить инвайт"),
                                        )
                                    }
                                },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Инвайт") }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { dialog = "status" },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Статус") }
                            OutlinedButton(
                                onClick = { dialog = "note" },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Заметка") }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { innerScreen = "profile" },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Анкета") }
                            OutlinedButton(
                                onClick = {
                                    viewModel.resetMeasurementForm()
                                    dialog = "measure"
                                },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Замер") }
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { dialog = "edit" },
                                modifier = Modifier.weight(1f),
                            ) { ActionLabel("Редактировать") }
                            OutlinedButton(
                                onClick = { dialog = "delete" },
                                modifier = Modifier.weight(1f),
                            ) {
                                ActionLabel("Удалить", color = LocalExtraColors.current.destructiveSoft)
                            }
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

    when (dialog) {
        "status" -> StatusDialog(
            current = (state as? Loadable.Ready)?.value?.client?.funnelStatus,
            onPick = { status ->
                viewModel.setStatus(clientId, status) {}
                dialog = null
            },
            onDismiss = { dialog = null },
        )

        "note" -> NoteDialog(
            busy = busy,
            error = actionError,
            onSave = { text -> viewModel.addNote(clientId, text) { dialog = null } },
            onDismiss = { dialog = null },
        )

        "measure" -> TrainerMeasurementDialog(
            viewModel = viewModel,
            clientId = clientId,
            onDismiss = {
                dialog = null
                viewModel.resetMeasurementForm()
            },
        )

        "edit" -> ClientUpsertDialog(
            title = "Редактировать клиента",
            initial = (state as? Loadable.Ready)?.value?.client,
            viewModel = viewModel,
            onSave = { request -> viewModel.updateClient(clientId, request) { dialog = null } },
            onDismiss = { dialog = null },
        )

        "delete" -> ConfirmDeleteDialog(
            text = "Клиент «$clientName» и его данные будут удалены.",
            onConfirm = {
                viewModel.deleteClient(clientId) { onBack() }
            },
            onDismiss = { dialog = null },
        )
    }
}

/** Подпись кнопки действия — в один ряд, без переноса. */
@Composable
private fun ActionLabel(text: String, color: androidx.compose.ui.graphics.Color? = null) {
    Text(
        text,
        style = MaterialTheme.typography.labelMedium,
        maxLines = 1,
        color = color ?: androidx.compose.ui.graphics.Color.Unspecified,
    )
}

/** Диалог создания/редактирования клиента (поля ClientUpsertRequest). */
@Composable
private fun ClientUpsertDialog(
    title: String,
    initial: TrainerClient?,
    viewModel: TrainerClientsViewModel,
    onSave: (ClientUpsertRequest) -> Unit,
    onDismiss: () -> Unit,
) {
    var name by rememberSaveable { mutableStateOf(initial?.name ?: "") }
    var goal by rememberSaveable { mutableStateOf(initial?.goal ?: "") }
    var level by rememberSaveable { mutableStateOf(initial?.level ?: "") }
    var age by rememberSaveable { mutableStateOf("") }
    var startDate by rememberSaveable { mutableStateOf(initial?.startDate ?: "") }
    var endDate by rememberSaveable { mutableStateOf(initial?.supportEndDate ?: "") }
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.actionError.collectAsState()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.verticalScroll(rememberScrollState()),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Имя*") },
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
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = level,
                        onValueChange = { level = it },
                        label = { Text("Уровень") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        value = age,
                        onValueChange = { age = it },
                        label = { Text("Возраст") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                    )
                }
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Старт (ГГГГ-ММ-ДД)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("Окончание (ГГГГ-ММ-ДД)") },
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
                    onSave(
                        ClientUpsertRequest(
                            name = name.trim(),
                            age = age.trim().toIntOrNull(),
                            goal = goal.trim().ifEmpty { null },
                            level = level.trim().ifEmpty { null },
                            startDate = startDate.trim().ifEmpty { null },
                            supportEndDate = endDate.trim().ifEmpty { null },
                        ),
                    )
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/** Диалог смены статуса воронки — список-клик. */
@Composable
private fun StatusDialog(
    current: String?,
    onPick: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Статус клиента") },
        text = {
            Column {
                FUNNEL_LABELS.forEach { (key, label) ->
                    Text(
                        if (key == current) "● $label" else label,
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (key == current) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onPick(key) }
                            .padding(vertical = 10.dp),
                    )
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/** Диалог заметки тренера. */
@Composable
private fun NoteDialog(
    busy: Boolean,
    error: String?,
    onSave: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    var text by rememberSaveable { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Новая заметка") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    label = { Text("Текст заметки*") },
                    minLines = 2,
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
                enabled = !busy && text.trim().isNotEmpty(),
                onClick = { onSave(text.trim()) },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

/** Диалог замера за клиента — как в MeasurementsTab, но с clientId. */
@Composable
private fun TrainerMeasurementDialog(
    viewModel: TrainerClientsViewModel,
    clientId: String,
    onDismiss: () -> Unit,
) {
    var date by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    var weight by rememberSaveable { mutableStateOf("") }
    var waist by rememberSaveable { mutableStateOf("") }
    var hips by rememberSaveable { mutableStateOf("") }
    var chest by rememberSaveable { mutableStateOf("") }

    val busy by viewModel.busy.collectAsState()
    val errorText by viewModel.actionError.collectAsState()
    val photoBefore by viewModel.photoBefore.collectAsState()
    val photoAfter by viewModel.photoAfter.collectAsState()
    val uploadingBefore by viewModel.uploadingBefore.collectAsState()
    val uploadingAfter by viewModel.uploadingAfter.collectAsState()

    val pickBefore = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri -> uri?.let { viewModel.uploadPhoto(it, isBefore = true) } }
    val pickAfter = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri -> uri?.let { viewModel.uploadPhoto(it, isBefore = false) } }

    fun num(s: String): Double? = s.replace(',', '.').toDoubleOrNull()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Новый замер") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Дата (ГГГГ-ММ-ДД)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MeasureField("Вес, кг", weight, { weight = it }, Modifier.weight(1f))
                    MeasureField("Талия, см", waist, { waist = it }, Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MeasureField("Бёдра, см", hips, { hips = it }, Modifier.weight(1f))
                    MeasureField("Грудь, см", chest, { chest = it }, Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    MeasurePhotoButton(
                        label = if (photoBefore != null) "Фото «до» ✓" else "Фото «до»",
                        uploading = uploadingBefore,
                        modifier = Modifier.weight(1f),
                    ) {
                        pickBefore.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                        )
                    }
                    MeasurePhotoButton(
                        label = if (photoAfter != null) "Фото «после» ✓" else "Фото «после»",
                        uploading = uploadingAfter,
                        modifier = Modifier.weight(1f),
                    ) {
                        pickAfter.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                        )
                    }
                }
                errorText?.let {
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
                enabled = !busy && !uploadingBefore && !uploadingAfter,
                onClick = {
                    viewModel.addMeasurement(
                        CreateMeasurementRequest(
                            date = date.trim(),
                            weight = num(weight),
                            waist = num(waist),
                            hips = num(hips),
                            chest = num(chest),
                            photoBeforeUrl = photoBefore,
                            photoAfterUrl = photoAfter,
                            clientId = clientId,
                        ),
                    ) { onDismiss() }
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

@Composable
private fun MeasureField(
    label: String,
    value: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        modifier = modifier,
    )
}

@Composable
private fun MeasurePhotoButton(
    label: String,
    uploading: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    OutlinedButton(onClick = onClick, enabled = !uploading, modifier = modifier) {
        if (uploading) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
        } else {
            Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(16.dp))
        }
        Spacer(Modifier.width(6.dp))
        Text(label, style = MaterialTheme.typography.labelMedium)
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
