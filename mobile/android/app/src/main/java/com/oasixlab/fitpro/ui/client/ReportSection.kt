package com.oasixlab.fitpro.ui.client

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.UploadRepository
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.MyFormResponse
import com.oasixlab.fitpro.data.api.ReportField
import com.oasixlab.fitpro.data.api.ReportSubmission
import com.oasixlab.fitpro.data.api.SubmitAnswer
import com.oasixlab.fitpro.data.api.SubmitReportRequest
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.formatDate
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.temporal.TemporalAdjusters
import javax.inject.Inject

data class ReportData(
    val form: MyFormResponse,
    val submissions: List<ReportSubmission>,
    val currentWeekStart: String,
) {
    val currentSubmitted: Boolean
        get() = submissions.any { it.weekStart == currentWeekStart }
}

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val api: FitProApi,
    private val uploads: UploadRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<ReportData>>(Loadable.Loading)
    val state: StateFlow<Loadable<ReportData>> = _state

    /** Ответы формы: fieldId → значение (для photo — URL из /uploads). */
    val answers = MutableStateFlow<Map<String, String>>(emptyMap())
    val uploadingField = MutableStateFlow<String?>(null)
    val error = MutableStateFlow<String?>(null)

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                val form = apiCall { api.myReportForm() }
                val submissions = apiCall { api.myReports() }.submissions
                val weekStart = LocalDate.now()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                    .toString()
                Loadable.Ready(ReportData(form, submissions, weekStart))
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить отчёты")
            }
        }
    }

    fun setAnswer(fieldId: String, value: String) {
        answers.value = answers.value + (fieldId to value)
    }

    fun uploadPhoto(fieldId: String, uri: Uri) {
        uploadingField.value = fieldId
        viewModelScope.launch {
            try {
                setAnswer(fieldId, uploads.uploadImage(uri))
            } catch (e: Exception) {
                error.value = e.message ?: "Не удалось загрузить фото"
            } finally {
                uploadingField.value = null
            }
        }
    }

    fun submit() {
        val data = (_state.value as? Loadable.Ready)?.value ?: return
        val form = data.form.form ?: return
        viewModelScope.launch {
            try {
                apiCall {
                    api.submitReport(
                        SubmitReportRequest(
                            formId = form.id,
                            weekStart = data.currentWeekStart,
                            answers = answers.value
                                .filterValues { it.isNotBlank() }
                                .map { (fieldId, value) -> SubmitAnswer(fieldId, value) },
                        ),
                    )
                }
                answers.value = emptyMap()
                refresh()
            } catch (e: Exception) {
                error.value = e.message
            }
        }
    }
}

@Composable
fun ReportSection(viewModel: ReportsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    LoadableBox(state, onRetry = viewModel::refresh) { data ->
        if (data.form.form == null) {
            EmptyTab("Формы отчёта нет", "Тренер ещё не настроил еженедельный отчёт")
            return@LoadableBox
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                if (data.currentSubmitted) {
                    Card(
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text("Отчёт за эту неделю отправлен ✓", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Тренер проверит и оставит комментарий",
                                style = MaterialTheme.typography.bodySmall,
                                color = LocalExtraColors.current.mutedForeground,
                            )
                        }
                    }
                } else {
                    ReportForm(data, viewModel)
                }
            }
            if (data.submissions.isNotEmpty()) {
                item {
                    Text("История", style = MaterialTheme.typography.titleMedium)
                }
                items(data.submissions, key = { it.id }) { submission ->
                    SubmissionRow(submission)
                }
            }
        }
    }
}

@Composable
private fun ReportForm(data: ReportData, viewModel: ReportsViewModel) {
    val answers by viewModel.answers.collectAsState()
    val uploadingField by viewModel.uploadingField.collectAsState()
    val error by viewModel.error.collectAsState()

    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(data.form.form!!.name, style = MaterialTheme.typography.titleMedium)
            data.form.fields.sortedBy { it.order }.forEach { field ->
                ReportFieldInput(
                    field = field,
                    value = answers[field.id] ?: "",
                    uploading = uploadingField == field.id,
                    onChange = { viewModel.setAnswer(field.id, it) },
                    onPickPhoto = { uri -> viewModel.uploadPhoto(field.id, uri) },
                )
            }
            error?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.destructiveSoft,
                )
            }
            Button(
                onClick = viewModel::submit,
                enabled = uploadingField == null,
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(48.dp),
            ) { Text("Отправить отчёт") }
        }
    }
}

@Composable
private fun ReportFieldInput(
    field: ReportField,
    value: String,
    uploading: Boolean,
    onChange: (String) -> Unit,
    onPickPhoto: (Uri) -> Unit,
) {
    when (field.type) {
        "photo" -> {
            val picker = rememberLauncherForActivityResult(
                ActivityResultContracts.PickVisualMedia(),
            ) { uri -> uri?.let(onPickPhoto) }
            OutlinedButton(
                onClick = {
                    picker.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                    )
                },
                enabled = !uploading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (uploading) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(16.dp))
                }
                Spacer(Modifier.width(6.dp))
                Text(if (value.isNotBlank()) "${field.label} ✓" else field.label)
            }
        }

        else -> OutlinedTextField(
            value = value,
            onValueChange = onChange,
            label = { Text(field.label) },
            singleLine = field.type == "number",
            keyboardOptions = if (field.type == "number") {
                KeyboardOptions(keyboardType = KeyboardType.Decimal)
            } else {
                KeyboardOptions.Default
            },
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun SubmissionRow(submission: ReportSubmission) {
    val extra = LocalExtraColors.current
    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(16.dp),
        ) {
            Text(
                "Неделя с ${formatDate(submission.weekStart)}",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.weight(1f),
            )
            val (label, color) = when (submission.status) {
                "reviewed" -> "Проверен" to extra.success
                "missed" -> "Пропущен" to extra.warning
                else -> "На проверке" to extra.info
            }
            Text(label, style = MaterialTheme.typography.labelMedium, color = color)
        }
    }
}
