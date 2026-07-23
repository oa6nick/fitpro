package com.oasixlab.fitpro.ui.client

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.oasixlab.fitpro.data.UploadRepository
import com.oasixlab.fitpro.data.api.BASE_URL
import com.oasixlab.fitpro.data.api.CreateMeasurementRequest
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.Measurement
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.AppearOnce
import com.oasixlab.fitpro.ui.common.ChartPoint
import com.oasixlab.fitpro.ui.common.ChipTone
import com.oasixlab.fitpro.ui.common.CoachlyChip
import com.oasixlab.fitpro.ui.common.LineAreaChart
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.OasixCard
import com.oasixlab.fitpro.ui.common.Stat
import com.oasixlab.fitpro.ui.common.StatTiles
import com.oasixlab.fitpro.ui.common.TabHeader
import com.oasixlab.fitpro.ui.common.formatDate
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

/**
 * Абсолютный URL файла из относительного /uploads/… с ?token= — сервер (requireFileAuth)
 * пускает к файлам только по валидному JWT, а Coil/Intent заголовок Bearer не добавляют.
 */
fun absoluteUrl(url: String): String {
    val base = if (url.startsWith("http")) url else BASE_URL.trimEnd('/') + url
    val token = com.oasixlab.fitpro.data.auth.SessionToken.value ?: return base
    if (!url.startsWith("/uploads")) return base
    val sep = if (base.contains('?')) '&' else '?'
    return "$base${sep}token=$token"
}

@HiltViewModel
class MeasurementsViewModel @Inject constructor(
    private val api: FitProApi,
    private val uploads: UploadRepository,
) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<List<Measurement>>>(Loadable.Loading)
    val state: StateFlow<Loadable<List<Measurement>>> = _state

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    /** URL загруженных фото формы (до/после) и флаги «идёт загрузка». */
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
                Loadable.Ready(apiCall { api.measurements() }.measurements)
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить замеры")
            }
        }
    }

    fun uploadPhoto(uri: android.net.Uri, isBefore: Boolean) {
        val flag = if (isBefore) uploadingBefore else uploadingAfter
        val target = if (isBefore) photoBefore else photoAfter
        flag.value = true
        viewModelScope.launch {
            try {
                target.value = uploads.uploadImage(uri)
            } catch (e: Exception) {
                _error.value = e.message ?: "Не удалось загрузить фото"
            } finally {
                flag.value = false
            }
        }
    }

    fun add(request: CreateMeasurementRequest, onDone: () -> Unit) {
        viewModelScope.launch {
            try {
                apiCall { api.addMeasurement(request) }
                resetForm()
                onDone()
                refresh()
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun resetForm() {
        photoBefore.value = null
        photoAfter.value = null
        _error.value = null
    }
}

@Composable
fun MeasurementsTab(viewModel: MeasurementsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    var showAdd by rememberSaveable { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Замеры")
        Box(Modifier.fillMaxSize()) {
        LoadableBox(state, onRetry = viewModel::refresh) { measurements ->
            if (measurements.isEmpty()) {
                EmptyTab("Замеров пока нет", "Добавьте первый — тренер увидит прогресс")
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    item { AppearOnce { WeightHeaderCard(measurements) } }
                    items(measurements, key = { it.id }) { m ->
                        MeasurementCard(m, Modifier.animateItem())
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { showAdd = true },
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
        ) {
            Icon(Icons.Default.Add, contentDescription = "Добавить замер")
        }
        }
    }

    if (showAdd) {
        AddMeasurementDialog(
            viewModel = viewModel,
            onDismiss = {
                showAdd = false
                viewModel.resetForm()
            },
            onSave = { req -> viewModel.add(req) { showAdd = false } },
        )
    }
}

/** Hero-карточка динамики веса: текущий вес + дельта + анимированный график. */
@Composable
private fun WeightHeaderCard(measurements: List<Measurement>) {
    val withWeight = measurements.filter { it.weight != null }.sortedBy { it.date }
    if (withWeight.isEmpty()) return
    val points = withWeight.map { m ->
        val d = m.date
        val label = if (d.length >= 10) d.substring(8, 10) + "." + d.substring(5, 7) else d
        ChartPoint(label, m.weight!!.toFloat())
    }
    val current = withWeight.last().weight!!
    val delta = current - withWeight.first().weight!!

    OasixCard(contentSpacing = 12.dp) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    "Динамика веса",
                    style = MaterialTheme.typography.labelSmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
                Text(
                    "${trim(current)} кг",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
            if (points.size >= 2) {
                val (tone, sign) = when {
                    delta < 0 -> ChipTone.Success to ""
                    delta > 0 -> ChipTone.Warning to "+"
                    else -> ChipTone.Neutral to ""
                }
                CoachlyChip("$sign${trim(delta)} кг за период", tone)
            }
        }
        LineAreaChart(points)
    }
}

@Composable
private fun MeasurementCard(m: Measurement, modifier: Modifier = Modifier) {
    OasixCard(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                formatDate(m.date),
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            m.weight?.let { CoachlyChip("${trim(it)} кг", ChipTone.Success) }
        }
        Spacer(Modifier.height(12.dp))
        StatTiles(
            listOf(
                Stat(metric(m.weight, "кг"), "Вес"),
                Stat(metric(m.waist, "см"), "Талия"),
                Stat(metric(m.hips, "см"), "Бёдра"),
                Stat(metric(m.chest, "см"), "Грудь"),
            ),
        )
        m.keyLifts?.takeIf { it.isNotEmpty() }?.let { lifts ->
            Spacer(Modifier.height(10.dp))
            Text(
                lifts.entries.joinToString { "${it.key}: ${it.value}" },
                style = MaterialTheme.typography.bodySmall,
                color = LocalExtraColors.current.mutedForeground,
            )
        }
        val photos = listOfNotNull(m.photoBeforeUrl, m.photoAfterUrl)
        if (photos.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                photos.forEach { url ->
                    AsyncImage(
                        model = absoluteUrl(url),
                        contentDescription = "Фото прогресса",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(96.dp)
                            .clip(RoundedCornerShape(12.dp)),
                    )
                }
            }
        }
    }
}

private fun metric(value: Double?, unit: String): String =
    value?.let { "${trim(it)} $unit" } ?: "—"

private fun trim(value: Double): String =
    if (value % 1.0 == 0.0) value.toInt().toString() else value.toString()

@Composable
private fun AddMeasurementDialog(
    viewModel: MeasurementsViewModel,
    onDismiss: () -> Unit,
    onSave: (CreateMeasurementRequest) -> Unit,
) {
    var date by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    var weight by rememberSaveable { mutableStateOf("") }
    var waist by rememberSaveable { mutableStateOf("") }
    var hips by rememberSaveable { mutableStateOf("") }
    var chest by rememberSaveable { mutableStateOf("") }

    val errorText by viewModel.error.collectAsState()
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
                    NumberField("Вес, кг", weight, { weight = it }, Modifier.weight(1f))
                    NumberField("Талия, см", waist, { waist = it }, Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    NumberField("Бёдра, см", hips, { hips = it }, Modifier.weight(1f))
                    NumberField("Грудь, см", chest, { chest = it }, Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    PhotoButton(
                        label = if (photoBefore != null) "Фото «до» ✓" else "Фото «до»",
                        uploading = uploadingBefore,
                        modifier = Modifier.weight(1f),
                    ) {
                        pickBefore.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                        )
                    }
                    PhotoButton(
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
                enabled = !uploadingBefore && !uploadingAfter,
                onClick = {
                    onSave(
                        CreateMeasurementRequest(
                            date = date.trim(),
                            weight = num(weight),
                            waist = num(waist),
                            hips = num(hips),
                            chest = num(chest),
                            photoBeforeUrl = photoBefore,
                            photoAfterUrl = photoAfter,
                        ),
                    )
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}

@Composable
private fun PhotoButton(
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
private fun NumberField(
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
