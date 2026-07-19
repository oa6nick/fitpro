package com.oasixlab.fitpro.data.auth

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore by preferencesDataStore(name = "fitpro_auth")

/**
 * Хранилище JWT. DataStore лежит в приватной песочнице приложения; перед релизом
 * в сторы обернуть значение шифрованием через Android Keystore (задача Ф5).
 */
@Singleton
class TokenStore @Inject constructor(@ApplicationContext private val context: Context) {
    private val tokenKey = stringPreferencesKey("token")

    private val onboardingKey = booleanPreferencesKey("onboarding_done")

    val token: Flow<String?> = context.dataStore.data.map { it[tokenKey] }

    /** Онбординг показываем один раз — флаг переживает логауты. */
    val onboardingDone: Flow<Boolean> = context.dataStore.data.map { it[onboardingKey] ?: false }

    suspend fun current(): String? = token.first()

    suspend fun save(token: String) {
        context.dataStore.edit { it[tokenKey] = token }
    }

    suspend fun clear() {
        context.dataStore.edit { it.remove(tokenKey) }
    }

    suspend fun setOnboardingDone() {
        context.dataStore.edit { it[onboardingKey] = true }
    }
}
