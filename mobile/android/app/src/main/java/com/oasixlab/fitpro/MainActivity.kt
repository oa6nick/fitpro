package com.oasixlab.fitpro

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.Box
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.data.auth.AuthRepository
import com.oasixlab.fitpro.ui.auth.AuthFlow
import com.oasixlab.fitpro.ui.home.ClientHomeScreen
import com.oasixlab.fitpro.ui.home.TrainerHomeScreen
import com.oasixlab.fitpro.ui.theme.FitProTheme
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FitProTheme {
                RootScreen()
            }
        }
    }
}

// Сессия приложения — эквивалент AuthContext веба и ролевых зон "/c" и "/t".
@HiltViewModel
class SessionViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    sealed interface Session {
        data object Loading : Session
        data object LoggedOut : Session
        data class Active(val user: User) : Session
    }

    private val _session = MutableStateFlow<Session>(Session.Loading)
    val session: StateFlow<Session> = _session

    init {
        viewModelScope.launch {
            _session.value = try {
                auth.restoreSession()?.let { Session.Active(it) } ?: Session.LoggedOut
            } catch (_: Exception) {
                // Сеть недоступна — не разлогиниваем, просто показываем логин.
                Session.LoggedOut
            }
        }
    }

    fun onLoggedIn(user: User) {
        _session.value = Session.Active(user)
    }

    fun logout() {
        viewModelScope.launch {
            auth.logout()
            _session.value = Session.LoggedOut
        }
    }
}

@Composable
fun RootScreen(viewModel: SessionViewModel = hiltViewModel()) {
    val session by viewModel.session.collectAsState()

    when (val s = session) {
        is SessionViewModel.Session.Loading ->
            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background,
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }

        is SessionViewModel.Session.LoggedOut ->
            AuthFlow(onLoggedIn = viewModel::onLoggedIn)

        is SessionViewModel.Session.Active ->
            when (s.user.role) {
                "trainer" -> TrainerHomeScreen(s.user, onLogout = viewModel::logout)
                else -> ClientHomeScreen(s.user, onLogout = viewModel::logout)
            }
    }
}
