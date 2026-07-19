package com.oasixlab.fitpro.ui.trainer

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import com.oasixlab.fitpro.data.api.FinanceResponse
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.NotificationsResponse
import com.oasixlab.fitpro.data.api.PaymentCreateRequest
import com.oasixlab.fitpro.data.api.TrainerClient
import com.oasixlab.fitpro.data.api.TrainerSubscriptionResponse
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.data.api.apiCall
import com.oasixlab.fitpro.ui.common.Loadable
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
class TrainerProfileViewModel @Inject constructor(private val api: FitProApi) : ViewModel() {
    private val _subscription =
        MutableStateFlow<Loadable<TrainerSubscriptionResponse>>(Loadable.Loading)
    val subscription: StateFlow<Loadable<TrainerSubscriptionResponse>> = _subscription

    private val _finance = MutableStateFlow<Loadable<FinanceResponse>>(Loadable.Loading)
    val finance: StateFlow<Loadable<FinanceResponse>> = _finance

    private val _notifications = MutableStateFlow<NotificationsResponse?>(null)
    val notifications: StateFlow<NotificationsResponse?> = _notifications

    /** Клиенты — для выпадающего списка в диалоге «Добавить оплату». */
    val clients = MutableStateFlow<List<TrainerClient>>(emptyList())

    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)

    init {
        refresh()
    }

    fun refresh() {
        _subscription.value = Loadable.Loading
        _finance.value = Loadable.Loading
        viewModelScope.launch {
            _subscription.value = try {
                Loadable.Ready(apiCall { api.trainerSubscription() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить подписку")
            }
            _finance.value = try {
                Loadable.Ready(apiCall { api.finance() })
            } catch (e: Exception) {
                Loadable.Error(e.message ?: "Не удалось загрузить финансы")
            }
            // Вспомогательные данные — некритичны, ошибки глотаем.
            _notifications.value = runCatching { apiCall { api.notifications() } }.getOrNull()
            clients.value =
                runCatching { apiCall { api.trainerClients() }.clients }.getOrDefault(emptyList())
        }
    }

    fun readAll() {
        viewModelScope.launch {
            runCatching { apiCall { api.readAllNotifications() } }
            _notifications.value = _notifications.value?.let { current ->
                current.copy(
                    notifications = current.notifications.map { it.copy(read = true) },
                    unread = 0,
                )
            }
        }
    }

    fun remind(paymentId: String) {
        viewModelScope.launch {
            runCatching { apiCall { api.remindPayment(paymentId) } }
        }
    }

    fun addPayment(request: PaymentCreateRequest, onDone: () -> Unit) {
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                apiCall { api.addPayment(request) }
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

private val SUBSCRIPTION_STATUS_LABELS = mapOf(
    "trial" to "Пробный период",
    "active" to "Активна",
    "expired" to "Истекла",
)

@Composable
fun TrainerProfileTab(
    user: User,
    onLogout: () -> Unit,
    viewModel: TrainerProfileViewModel = hiltViewModel(),
) {
    val subscription by viewModel.subscription.collectAsState()
    val finance by viewModel.finance.collectAsState()
    val notifications by viewModel.notifications.collectAsState()
    val extra = LocalExtraColors.current
    var showAddPayment by rememberSaveable { mutableStateOf(false) }

    Column(Modifier.fillMaxSize()) {
        TabHeader("Профиль")
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                SectionCard {
                    Text(user.name, style = MaterialTheme.typography.titleMedium)
                    Text(
                        user.email,
                        style = MaterialTheme.typography.bodyMedium,
                        color = extra.mutedForeground,
                    )
                }
            }

            item { SubscriptionCard(subscription) }

            item {
                FinanceCard(
                    state = finance,
                    onRemind = viewModel::remind,
                    onAddPayment = { showAddPayment = true },
                )
            }

            notifications?.takeIf { it.notifications.isNotEmpty() }?.let { data ->
                item {
                    SectionCard {
                        Row(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                if (data.unread > 0) "Уведомления (${data.unread})" else "Уведомления",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.weight(1f),
                            )
                            if (data.unread > 0) {
                                TextButton(onClick = viewModel::readAll) { Text("Прочитать все") }
                            }
                        }
                        data.notifications.take(10).forEach { n ->
                            Text(
                                (if (n.read) "" else "● ") + n.text,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (n.read) extra.mutedForeground
                                else MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    }
                }
            }

            item {
                TextButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                    Text("Выйти", color = extra.destructiveSoft)
                }
            }
        }
    }

    if (showAddPayment) {
        AddPaymentDialog(
            viewModel = viewModel,
            onDismiss = { showAddPayment = false },
        )
    }
}

/** Общая карточка секции профиля. */
@Composable
private fun SectionCard(content: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit) {
    Card(
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            content = content,
        )
    }
}

@Composable
private fun SubscriptionCard(state: Loadable<TrainerSubscriptionResponse>) {
    val extra = LocalExtraColors.current
    SectionCard {
        Text("Подписка", style = MaterialTheme.typography.titleMedium)
        when (state) {
            is Loadable.Loading -> CircularProgressIndicator(
                modifier = Modifier.height(24.dp),
                strokeWidth = 2.dp,
            )

            is Loadable.Error -> Text(
                state.message,
                style = MaterialTheme.typography.bodySmall,
                color = extra.destructiveSoft,
            )

            is Loadable.Ready -> {
                val sub = state.value.subscription
                if (sub == null) {
                    Text("Тариф не ограничен", style = MaterialTheme.typography.bodyMedium)
                } else {
                    Text(sub.planTitle, style = MaterialTheme.typography.bodyLarge)
                    Text(
                        "Статус: ${SUBSCRIPTION_STATUS_LABELS[sub.status] ?: sub.status}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = when (sub.status) {
                            "active" -> extra.success
                            "trial" -> extra.info
                            "expired" -> extra.destructiveSoft
                            else -> MaterialTheme.colorScheme.onSurface
                        },
                    )
                    sub.paidUntil?.let {
                        Text(
                            "Оплачено до: ${formatDate(it)}",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    Text(
                        "Клиентов: ${sub.clientsUsed} из ${sub.clientLimit}",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    if (sub.clientLimit > 0) {
                        LinearProgressIndicator(
                            progress = {
                                (sub.clientsUsed.toFloat() / sub.clientLimit).coerceIn(0f, 1f)
                            },
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }
                Spacer(Modifier.height(2.dp))
                // Политика сторов: без цен и кнопок оплаты в приложении.
                Text(
                    "Управление подпиской — на сайте fitpro.oasixlab.com",
                    style = MaterialTheme.typography.bodySmall,
                    color = extra.mutedForeground,
                )
            }
        }
    }
}

private val PAYMENT_STATUS_LABELS = mapOf(
    "paid" to "оплачен",
    "overdue" to "просрочен",
    "pending" to "ожидает",
)

@Composable
private fun FinanceCard(
    state: Loadable<FinanceResponse>,
    onRemind: (String) -> Unit,
    onAddPayment: () -> Unit,
) {
    val extra = LocalExtraColors.current
    SectionCard {
        Text("Финансы", style = MaterialTheme.typography.titleMedium)
        when (state) {
            is Loadable.Loading -> CircularProgressIndicator(
                modifier = Modifier.height(24.dp),
                strokeWidth = 2.dp,
            )

            is Loadable.Error -> Text(
                state.message,
                style = MaterialTheme.typography.bodySmall,
                color = extra.destructiveSoft,
            )

            is Loadable.Ready -> {
                val data = state.value
                Text(
                    "Получено: ${data.totals.paid.toInt()} ₽",
                    style = MaterialTheme.typography.bodyMedium,
                    color = extra.success,
                )
                Text(
                    "Просрочено: ${data.totals.overdue}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (data.totals.overdue > 0) extra.destructiveSoft else MaterialTheme.colorScheme.onSurface,
                )
                data.payments.take(5).forEach { p ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                "${p.clientName ?: "Клиент"} — ${p.amount.toInt()} ₽",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Row {
                                Text(
                                    "${formatDate(p.date)} · ",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = extra.mutedForeground,
                                )
                                Text(
                                    PAYMENT_STATUS_LABELS[p.status] ?: p.status,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = when (p.status) {
                                        "paid" -> extra.success
                                        "overdue" -> extra.destructiveSoft
                                        else -> extra.mutedForeground
                                    },
                                )
                            }
                        }
                        if (p.status == "overdue") {
                            TextButton(onClick = { onRemind(p.id) }) { Text("Напомнить") }
                        }
                    }
                }
                OutlinedButton(onClick = onAddPayment, modifier = Modifier.fillMaxWidth()) {
                    Text("Добавить оплату")
                }
            }
        }
    }
}

@Composable
private fun AddPaymentDialog(viewModel: TrainerProfileViewModel, onDismiss: () -> Unit) {
    val clients by viewModel.clients.collectAsState()
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()

    var selectedClient by remember { mutableStateOf<TrainerClient?>(null) }
    var clientsExpanded by remember { mutableStateOf(false) }
    var amount by rememberSaveable { mutableStateOf("") }
    var date by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
    var periodStart by rememberSaveable { mutableStateOf("") }
    var periodEnd by rememberSaveable { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Добавить оплату") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Box {
                    OutlinedButton(
                        onClick = { clientsExpanded = true },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(selectedClient?.name ?: "Выберите клиента")
                    }
                    DropdownMenu(
                        expanded = clientsExpanded,
                        onDismissRequest = { clientsExpanded = false },
                    ) {
                        clients.forEach { client ->
                            DropdownMenuItem(
                                text = { Text(client.name) },
                                onClick = {
                                    selectedClient = client
                                    clientsExpanded = false
                                },
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Сумма, ₽") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = date,
                    onValueChange = { date = it },
                    label = { Text("Дата (ГГГГ-ММ-ДД)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = periodStart,
                        onValueChange = { periodStart = it },
                        label = { Text("Период с") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedTextField(
                        value = periodEnd,
                        onValueChange = { periodEnd = it },
                        label = { Text("Период по") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                    )
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
            val amountValue = amount.replace(',', '.').toDoubleOrNull()
            Button(
                enabled = !busy && selectedClient != null && amountValue != null,
                onClick = {
                    viewModel.addPayment(
                        PaymentCreateRequest(
                            clientId = selectedClient!!.id,
                            amount = amountValue ?: return@Button,
                            date = date.trim(),
                            periodStart = periodStart.trim().ifEmpty { null },
                            periodEnd = periodEnd.trim().ifEmpty { null },
                        ),
                    ) { onDismiss() }
                },
            ) { Text("Сохранить") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Отмена") } },
    )
}
