package com.oasixlab.fitpro.ui.trainer

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.AssignWorkoutRequest
import com.oasixlab.fitpro.data.api.Exercise
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.WorkoutTemplate
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class AssignWorkoutViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _templates = MutableStateFlow<Loadable<List<WorkoutTemplate>>>(Loadable.Loading)
    val templates: StateFlow<Loadable<List<WorkoutTemplate>>> = _templates

    private val _exercises = MutableStateFlow<Loadable<List<Exercise>>>(Loadable.Loading)
    val exercises: StateFlow<Loadable<List<Exercise>>> = _exercises

    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)

    init {
        refresh()
    }

    fun refresh() {
        _templates.value = Loadable.Loading
        _exercises.value = Loadable.Loading
        viewModelScope.launch {
            _templates.value = try {
                Loadable.Ready(apiCall { api.templates() }.templates)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить шаблоны")
            }
            _exercises.value = try {
                Loadable.Ready(apiCall { api.exercises() }.exercises)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить упражнения")
            }
        }
    }

    fun assign(request: AssignWorkoutRequest, onDone: () -> Unit) {
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                apiCall { api.assignWorkout(request) }
                onDone()
            } catch (e: Exception) {
                error.value = e.message
            } finally {
                busy.value = false
            }
        }
    }
}

/** Экран «Назначить тренировку» — открывается из карточки клиента. */
@Composable
fun AssignWorkoutScreen(
    clientId: String,
    clientName: String,
    onBack: () -> Unit,
    onAssigned: () -> Unit,
    viewModel: AssignWorkoutViewModel = hiltViewModel(),
) {
    val templatesState by viewModel.templates.collectAsState()
    val exercisesState by viewModel.exercises.collectAsState()
    val exercises = (exercisesState as? Loadable.Ready)?.value ?: emptyList()
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()
    val extra = LocalExtraColors.current

    var title by rememberSaveable { mutableStateOf("") }
    var date by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    var mode by rememberSaveable { mutableIntStateOf(0) } // 0 — из шаблона, 1 — вручную
    var selectedTemplateId by rememberSaveable { mutableStateOf<String?>(null) }
    val rows = remember { mutableStateListOf<DraftRow>() }

    Column(Modifier.fillMaxSize()) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(top = 8.dp, start = 4.dp, end = 16.dp),
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад")
            }
            Column {
                Text("Назначить тренировку", style = MaterialTheme.typography.titleLarge)
                Text(
                    clientName,
                    style = MaterialTheme.typography.bodySmall,
                    color = extra.mutedForeground,
                )
            }
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Название") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = date,
                onValueChange = { date = it },
                label = { Text("Дата (ГГГГ-ММ-ДД)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                listOf("Из шаблона", "Вручную").forEachIndexed { index, label ->
                    SegmentedButton(
                        selected = mode == index,
                        onClick = { mode = index },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = 2),
                    ) { Text(label) }
                }
            }

            if (mode == 0) {
                when (val state = templatesState) {
                    is Loadable.Loading -> Text(
                        "Загрузка шаблонов…",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )

                    is Loadable.Error -> Text(
                        state.message,
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.destructiveSoft,
                    )

                    is Loadable.Ready -> {
                        if (state.value.isEmpty()) {
                            Text(
                                "Шаблонов пока нет — создайте их во вкладке «Студия» или соберите тренировку вручную",
                                style = MaterialTheme.typography.bodySmall,
                                color = extra.mutedForeground,
                            )
                        }
                        state.value.forEach { template ->
                            Card(
                                shape = MaterialTheme.shapes.medium,
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surface,
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedTemplateId = template.id },
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(
                                        start = 4.dp, top = 4.dp, bottom = 4.dp, end = 14.dp,
                                    ),
                                ) {
                                    RadioButton(
                                        selected = selectedTemplateId == template.id,
                                        onClick = { selectedTemplateId = template.id },
                                    )
                                    Column {
                                        Text(template.name, style = MaterialTheme.typography.titleSmall)
                                        template.goal?.let {
                                            Text(
                                                it,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = extra.mutedForeground,
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                WorkoutRowsEditor(rows, exercises)
            }

            error?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = extra.destructiveSoft,
                )
            }
            Button(
                enabled = !busy &&
                    (if (mode == 0) selectedTemplateId != null else rows.isNotEmpty()),
                onClick = {
                    val request = if (mode == 0) {
                        AssignWorkoutRequest(
                            clientId = clientId,
                            title = title.trim().ifEmpty { null },
                            date = date.trim().ifEmpty { null },
                            templateId = selectedTemplateId,
                            exercises = null,
                        )
                    } else {
                        AssignWorkoutRequest(
                            clientId = clientId,
                            title = title.trim().ifEmpty { null },
                            date = date.trim().ifEmpty { null },
                            templateId = null,
                            exercises = rows.mapIndexed { index, row -> row.toDraft(index) },
                        )
                    }
                    viewModel.assign(request) { onAssigned() }
                },
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text("Назначить") }
            Spacer(Modifier.height(8.dp))
        }
    }
}
