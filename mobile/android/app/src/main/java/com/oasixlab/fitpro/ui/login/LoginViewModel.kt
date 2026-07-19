package com.oasixlab.fitpro.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.data.auth.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    data class UiState(
        val isSubmitting: Boolean = false,
        val error: String? = null,
    )

    private val _state = MutableStateFlow(UiState())
    val state: StateFlow<UiState> = _state

    fun login(email: String, password: String, onSuccess: (User) -> Unit) {
        _state.value = UiState(isSubmitting = true)
        viewModelScope.launch {
            try {
                val user = auth.login(email.trim(), password)
                _state.value = UiState()
                onSuccess(user)
            } catch (e: Exception) {
                _state.value = UiState(error = e.message ?: "Не удалось войти")
            }
        }
    }
}
