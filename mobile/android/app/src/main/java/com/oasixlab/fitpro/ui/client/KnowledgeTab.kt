package com.oasixlab.fitpro.ui.client

import android.content.Intent
import androidx.core.net.toUri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.BASE_URL
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.KnowledgeItem
import com.oasixlab.fitpro.data.api.KnowledgeResponse
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

@HiltViewModel
class KnowledgeViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<KnowledgeResponse>>(Loadable.Loading)
    val state: StateFlow<Loadable<KnowledgeResponse>> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.myKnowledge() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить материалы")
            }
        }
    }
}

private val CATEGORY_LABELS = mapOf(
    "nutrition" to "Питание",
    "training" to "Тренинг",
    "measurements" to "Замеры",
    "recovery" to "Восстановление",
)

private val TYPE_LABELS = mapOf(
    "pdf" to "PDF",
    "video" to "Видео",
    "checklist" to "Чек-лист",
)

@Composable
fun KnowledgeTab(viewModel: KnowledgeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current

    Column(Modifier.fillMaxSize()) {
    TabHeader("Материалы")
    LoadableBox(state, onRetry = viewModel::refresh) { data ->
        if (data.items.isEmpty()) {
            EmptyTab("Материалов пока нет", "Тренер откроет их по мере программы")
            return@LoadableBox
        }
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                Text(
                    "Неделя программы: ${data.currentWeek}",
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
            items(data.items, key = { it.id }) { itemData ->
                KnowledgeCard(itemData) {
                    itemData.fileUrl?.let { url ->
                        // absoluteUrl добавит ?token= — сервер отдаёт файл только по JWT.
                        context.startActivity(Intent(Intent.ACTION_VIEW, absoluteUrl(url).toUri()))
                    }
                }
            }
        }
    }
    }
}

@Composable
private fun KnowledgeCard(item: KnowledgeItem, onOpen: () -> Unit) {
    val extra = LocalExtraColors.current
    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !item.locked && item.fileUrl != null, onClick = onOpen),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(16.dp),
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    "${CATEGORY_LABELS[item.category] ?: item.category} · ${TYPE_LABELS[item.type] ?: item.type}",
                    style = MaterialTheme.typography.labelSmall,
                    color = extra.mutedForeground,
                )
                Text(item.title, style = MaterialTheme.typography.titleMedium)
                if (item.locked) {
                    Text(
                        "Откроется на неделе ${item.unlockWeek}",
                        style = MaterialTheme.typography.bodySmall,
                        color = extra.mutedForeground,
                    )
                }
            }
            Spacer(Modifier.width(8.dp))
            if (item.locked) {
                Icon(Icons.Default.Lock, contentDescription = "Заблокировано", tint = extra.mutedForeground)
            } else {
                Icon(
                    Icons.AutoMirrored.Filled.OpenInNew,
                    contentDescription = "Открыть",
                    tint = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}
