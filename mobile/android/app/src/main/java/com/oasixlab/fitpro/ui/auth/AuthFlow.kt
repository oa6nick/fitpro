package com.oasixlab.fitpro.ui.auth

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.InviteInfo
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.data.auth.AuthRepository
import com.oasixlab.fitpro.data.auth.TokenStore
import com.oasixlab.fitpro.ui.login.LoginScreen
import com.oasixlab.fitpro.ui.theme.LocalExtraColors
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthFlowViewModel @Inject constructor(
    private val tokenStore: TokenStore,
    private val auth: AuthRepository,
) : ViewModel() {

    /** null = флаг ещё читается из DataStore (не мигаем онбордингом зря). */
    val onboardingDone: StateFlow<Boolean?> = tokenStore.onboardingDone
        .map<Boolean, Boolean?> { it }
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)
    val inviteInfo = MutableStateFlow<InviteInfo?>(null)

    fun completeOnboarding() {
        viewModelScope.launch { tokenStore.setOnboardingDone() }
    }

    fun register(name: String, email: String, password: String, onSuccess: (User) -> Unit) {
        run(onSuccess) { auth.registerTrainer(name.trim(), email.trim(), password) }
    }

    fun loadInvite(tokenOrLink: String) {
        val token = parseInviteToken(tokenOrLink) ?: run {
            error.value = "Вставьте ссылку-приглашение или код из неё"
            return
        }
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                inviteInfo.value = auth.inviteInfo(token)
            } catch (e: Exception) {
                error.value = e.message
            } finally {
                busy.value = false
            }
        }
    }

    fun acceptInvite(tokenOrLink: String, email: String, password: String, onSuccess: (User) -> Unit) {
        val token = parseInviteToken(tokenOrLink) ?: return
        run(onSuccess) { auth.acceptInvite(token, email.trim(), password) }
    }

    fun resetInvite() {
        inviteInfo.value = null
        error.value = null
    }

    private fun run(onSuccess: (User) -> Unit, block: suspend () -> User) {
        busy.value = true
        error.value = null
        viewModelScope.launch {
            try {
                onSuccess(block())
            } catch (e: Exception) {
                error.value = e.message ?: "Что-то пошло не так"
            } finally {
                busy.value = false
            }
        }
    }

    companion object {
        /** Принимаем и полную ссылку …/join/<код>, и голый код. */
        fun parseInviteToken(input: String): String? {
            val trimmed = input.trim().removeSuffix("/")
            if (trimmed.isEmpty()) return null
            val token = trimmed.substringAfterLast("/")
            return token.takeIf { it.length >= 16 && it.none(Char::isWhitespace) }
        }
    }
}

private enum class AuthScreen { Landing, Login, Register, Join }

/** Экранная цепочка до входа: онбординг → лендинг → логин/регистрация/инвайт. */
@Composable
fun AuthFlow(
    onLoggedIn: (User) -> Unit,
    viewModel: AuthFlowViewModel = hiltViewModel(),
) {
    val onboardingDone by viewModel.onboardingDone.collectAsState()
    var screen by rememberSaveable { mutableStateOf(AuthScreen.Landing) }

    when (onboardingDone) {
        null -> Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {}

        false -> OnboardingScreen(onFinish = viewModel::completeOnboarding)

        true -> {
            if (screen != AuthScreen.Landing) {
                BackHandler {
                    viewModel.resetInvite()
                    screen = AuthScreen.Landing
                }
            }
            when (screen) {
                AuthScreen.Landing -> LandingScreen(
                    onLogin = { screen = AuthScreen.Login },
                    onRegister = { screen = AuthScreen.Register },
                    onJoin = { screen = AuthScreen.Join },
                )

                AuthScreen.Login -> LoginScreen(onLoggedIn = onLoggedIn)

                AuthScreen.Register -> RegisterTrainerScreen(viewModel, onLoggedIn)

                AuthScreen.Join -> JoinInviteScreen(viewModel, onLoggedIn)
            }
        }
    }
}

/* ------------------------------ Онбординг ------------------------------ */

private data class OnboardingPage(
    val icon: ImageVector,
    val title: String,
    val text: String,
)

private val ONBOARDING_PAGES = listOf(
    OnboardingPage(
        Icons.Default.FitnessCenter,
        "Дневник тренировок",
        "Программа от тренера всегда в телефоне: отмечайте подходы, веса и повторы — таймер отдыха подскажет паузу",
    ),
    OnboardingPage(
        Icons.Default.ShowChart,
        "Прогресс на ладони",
        "Замеры, фото «до/после» и привычки недели — тренер видит вашу динамику и вовремя корректирует план",
    ),
    OnboardingPage(
        Icons.AutoMirrored.Filled.MenuBook,
        "Тренер всегда рядом",
        "Проверка дневников, еженедельные отчёты и материалы программы открываются по мере вашего прогресса",
    ),
)

@Composable
fun OnboardingScreen(onFinish: () -> Unit) {
    val pagerState = rememberPagerState(pageCount = { ONBOARDING_PAGES.size })
    val scope = rememberCoroutineScope()
    val isLast = pagerState.currentPage == ONBOARDING_PAGES.lastIndex

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.fillMaxSize().systemBarsPadding().padding(24.dp)) {
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "COACHLY",
                    style = MaterialTheme.typography.labelSmall,
                    color = LocalExtraColors.current.mutedForeground,
                )
                Spacer(Modifier.weight(1f))
                TextButton(onClick = onFinish) { Text("Пропустить") }
            }

            HorizontalPager(state = pagerState, modifier = Modifier.weight(1f)) { index ->
                val page = ONBOARDING_PAGES[index]
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(120.dp)
                            .background(
                                MaterialTheme.colorScheme.tertiary,
                                CircleShape,
                            ),
                    ) {
                        Icon(
                            page.icon,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onTertiary,
                            modifier = Modifier.size(52.dp),
                        )
                    }
                    Spacer(Modifier.height(28.dp))
                    Text(
                        page.title,
                        style = MaterialTheme.typography.headlineMedium,
                        modifier = Modifier.padding(horizontal = 8.dp),
                    )
                    Spacer(Modifier.height(12.dp))
                    Text(
                        page.text,
                        style = MaterialTheme.typography.bodyLarge,
                        color = LocalExtraColors.current.mutedForeground,
                        modifier = Modifier.padding(horizontal = 8.dp),
                    )
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.align(Alignment.CenterHorizontally),
            ) {
                ONBOARDING_PAGES.indices.forEach { index ->
                    Box(
                        Modifier
                            .size(if (index == pagerState.currentPage) 10.dp else 8.dp)
                            .background(
                                if (index == pagerState.currentPage) {
                                    MaterialTheme.colorScheme.primary
                                } else {
                                    LocalExtraColors.current.border
                                },
                                CircleShape,
                            ),
                    )
                }
            }
            Spacer(Modifier.height(20.dp))
            Button(
                onClick = {
                    if (isLast) {
                        onFinish()
                    } else {
                        scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                    }
                },
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Text(if (isLast) "Начать" else "Дальше")
            }
        }
    }
}

/* ------------------------------- Лендинг ------------------------------- */

@Composable
private fun LandingScreen(onLogin: () -> Unit, onRegister: () -> Unit, onJoin: () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().systemBarsPadding().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.weight(1f))
            Text(
                "COACHLY",
                style = MaterialTheme.typography.labelSmall,
                color = LocalExtraColors.current.mutedForeground,
            )
            Spacer(Modifier.height(8.dp))
            Text("Тренинг под контролем", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            Text(
                "Пространство тренера и клиента:\nпрограммы, дневник, прогресс",
                style = MaterialTheme.typography.bodyLarge,
                color = LocalExtraColors.current.mutedForeground,
            )
            Spacer(Modifier.weight(1f))

            Button(
                onClick = onLogin,
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text("Войти") }
            Spacer(Modifier.height(10.dp))
            OutlinedButton(
                onClick = onRegister,
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text("Я тренер — создать аккаунт") }
            Spacer(Modifier.height(10.dp))
            OutlinedButton(
                onClick = onJoin,
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) { Text("Я клиент — у меня приглашение") }
            Spacer(Modifier.height(16.dp))
        }
    }
}

/* --------------------------- Регистрация тренера --------------------------- */

@Composable
private fun RegisterTrainerScreen(viewModel: AuthFlowViewModel, onLoggedIn: (User) -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()

    AuthFormScaffold(
        title = "Аккаунт тренера",
        subtitle = "14 дней бесплатно, до 10 клиентов. Для примера сразу появится тестовый клиент.",
    ) {
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Имя") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Пароль (минимум 6 символов)") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let { ErrorText(it) }
        SubmitButton(
            text = "Создать аккаунт",
            busy = busy,
            enabled = name.isNotBlank() && email.isNotBlank() && password.length >= 6,
        ) {
            viewModel.register(name, email, password, onLoggedIn)
        }
    }
}

/* ----------------------------- Инвайт клиента ----------------------------- */

@Composable
private fun JoinInviteScreen(viewModel: AuthFlowViewModel, onLoggedIn: (User) -> Unit) {
    var link by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    val busy by viewModel.busy.collectAsState()
    val error by viewModel.error.collectAsState()
    val invite by viewModel.inviteInfo.collectAsState()

    AuthFormScaffold(
        title = "Вход по приглашению",
        subtitle = invite?.let { null }
            ?: "Тренер прислал вам ссылку вида fitpro…/join/… — вставьте её целиком или код после /join/",
    ) {
        invite?.let { info ->
            Card(
                shape = MaterialTheme.shapes.medium,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text("Тренер: ${info.trainerName}", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "Ваша карточка: ${info.clientName}",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Пароль (минимум 6 символов)") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )
            error?.let { ErrorText(it) }
            SubmitButton(
                text = "Создать кабинет",
                busy = busy,
                enabled = email.isNotBlank() && password.length >= 6,
            ) {
                viewModel.acceptInvite(link, email, password, onLoggedIn)
            }
        } ?: run {
            OutlinedTextField(
                value = link,
                onValueChange = { link = it },
                label = { Text("Ссылка или код приглашения") },
                modifier = Modifier.fillMaxWidth(),
            )
            error?.let { ErrorText(it) }
            SubmitButton(text = "Продолжить", busy = busy, enabled = link.isNotBlank()) {
                viewModel.loadInvite(link)
            }
        }
    }
}

/* ------------------------------ Общие детали ------------------------------ */

@Composable
private fun AuthFormScaffold(
    title: String,
    subtitle: String?,
    content: @Composable () -> Unit,
) {
    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier.fillMaxSize().systemBarsPadding().padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                "COACHLY",
                style = MaterialTheme.typography.labelSmall,
                color = LocalExtraColors.current.mutedForeground,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
            Spacer(Modifier.height(8.dp))
            Text(
                title,
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
            subtitle?.let {
                Spacer(Modifier.height(8.dp))
                Text(
                    it,
                    style = MaterialTheme.typography.bodyMedium,
                    color = LocalExtraColors.current.mutedForeground,
                )
            }
            Spacer(Modifier.height(20.dp))
            Card(
                shape = MaterialTheme.shapes.large,
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Column(
                    Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    content()
                }
            }
        }
    }
}

@Composable
private fun ErrorText(message: String) {
    Text(
        message,
        style = MaterialTheme.typography.bodySmall,
        color = LocalExtraColors.current.destructiveSoft,
    )
}

@Composable
private fun SubmitButton(text: String, busy: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        enabled = enabled && !busy,
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth().height(52.dp),
    ) {
        if (busy) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                color = MaterialTheme.colorScheme.onPrimary,
                strokeWidth = 2.dp,
            )
        } else {
            Text(text)
        }
    }
}
