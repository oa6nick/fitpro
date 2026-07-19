package com.oasixlab.fitpro.ui.trainer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.NotificationsResponse
import com.oasixlab.fitpro.data.api.apiCall
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

@HiltViewModel
class NotificationsViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _state = MutableStateFlow<Loadable<NotificationsResponse>>(Loadable.Loading)
    val state: StateFlow<Loadable<NotificationsResponse>> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = Loadable.Loading
        viewModelScope.launch {
            _state.value = try {
                Loadable.Ready(apiCall { api.notifications() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить уведомления")
            }
        }
    }

    fun readAll() {
        viewModelScope.launch {
            runCatching { apiCall { api.readAllNotifications() } }
            (_state.value as? Loadable.Ready)?.let { ready ->
                _state.value = Loadable.Ready(
                    ready.value.copy(
                        notifications = ready.value.notifications.map { it.copy(read = true) },
                        unread = 0,
                    ),
                )
            }
        }
    }
}

@Composable
fun NotificationsTab(viewModel: NotificationsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val extra = LocalExtraColors.current

    Column(Modifier.fillMaxSize()) {
        TabHeader("Уведомления")
        LoadableBox(state, onRetry = viewModel::refresh) { data ->
            if (data.notifications.isEmpty()) {
                EmptyTab("Уведомлений нет", "События клиентов появятся здесь")
                return@LoadableBox
            }
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (data.unread > 0) {
                    item {
                        Row(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                "Непрочитанных: ${data.unread}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = extra.mutedForeground,
                                modifier = Modifier.weight(1f),
                            )
                            TextButton(onClick = viewModel::readAll) { Text("Прочитать все") }
                        }
                    }
                }
                items(data.notifications, key = { it.id }) { n ->
                    Card(
                        shape = MaterialTheme.shapes.medium,
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.padding(14.dp)) {
                            Text(
                                (if (n.read) "" else "● ") + n.text,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (n.read) extra.mutedForeground else MaterialTheme.colorScheme.onSurface,
                            )
                            Text(
                                formatDate(n.createdAt),
                                style = MaterialTheme.typography.labelSmall,
                                color = extra.mutedForeground,
                            )
                        }
                    }
                }
            }
        }
    }
}
