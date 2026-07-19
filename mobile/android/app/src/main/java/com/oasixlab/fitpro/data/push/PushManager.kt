package com.oasixlab.fitpro.data.push

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.oasixlab.fitpro.data.api.DeviceTokenRequest
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.apiCall
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Регистрация FCM-токена на сервере. Без google-services.json FirebaseApp
 * не инициализирован — все операции тихо пропускаются (push выключен).
 */
@Singleton
class PushManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val api: FitProApi,
) {
    private val firebaseReady: Boolean
        get() = FirebaseApp.getApps(context).isNotEmpty()

    /** После логина/восстановления сессии: токен устройства → серверу. */
    suspend fun registerToken() {
        if (!firebaseReady) return
        runCatching {
            val token = FirebaseMessaging.getInstance().token.await()
            apiCall { api.registerDevice(DeviceTokenRequest(platform = "android", token = token)) }
        }
    }

    /** На логаут: отвязать токен, чтобы push не приходил бывшему пользователю. */
    suspend fun unregisterToken() {
        if (!firebaseReady) return
        runCatching {
            val token = FirebaseMessaging.getInstance().token.await()
            apiCall { api.unregisterDevice(DeviceTokenRequest(platform = "android", token = token)) }
        }
    }
}
