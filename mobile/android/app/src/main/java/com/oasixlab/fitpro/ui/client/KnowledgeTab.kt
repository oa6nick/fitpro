package com.oasixlab.fitpro.ui.client

import android.content.Intent
import androidx.core.net.toUri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.R
import com.oasixlab.fitpro.data.api.BASE_URL
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.KnowledgeItem
import com.oasixlab.fitpro.data.api.KnowledgeResponse
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.IconBadge
import com.oasixlab.fitpro.ui.common.Loadable
import com.oasixlab.fitpro.ui.common.LoadableBox
import com.oasixlab.fitpro.ui.common.OasixCard
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

private fun categoryIcon(category: String): Int = when (category) {
    "nutrition" -> R.drawable.ic_fit_health
    "training" -> R.drawable.ic_fit_gym
    "measurements" -> R.drawable.ic_fit_strength
    "recovery" -> R.drawable.ic_fit_spa
    else -> R.drawable.ic_readiness
}

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
            contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text(
                    "Неделя программы: ${data.currentWeek}",
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
            items(data.items, key = { it.id }) { itemData ->
                KnowledgeCard(itemData, modifier = Modifier.animateItem()) {
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
private fun KnowledgeCard(item: KnowledgeItem, modifier: Modifier = Modifier, onOpen: () -> Unit) {
    val extra = LocalExtraColors.current
    OasixCard(modifier = modifier, onClick = if (!item.locked && item.fileUrl != null) onOpen else null) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (item.locked) {
                IconBadge(
                    icon = painterResource(categoryIcon(item.category)),
                    background = extra.input,
                    tint = extra.mutedForeground,
                )
            } else {
                IconBadge(icon = painterResource(categoryIcon(item.category)))
            }
            Spacer(Modifier.width(12.dp))
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
