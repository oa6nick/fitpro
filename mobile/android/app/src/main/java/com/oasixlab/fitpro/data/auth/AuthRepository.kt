package com.oasixlab.fitpro.data.auth

import com.oasixlab.fitpro.data.api.AcceptInviteRequest
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.InviteInfo
import com.oasixlab.fitpro.data.api.LoginRequest
import com.oasixlab.fitpro.data.api.RegisterRequest
import com.oasixlab.fitpro.data.api.User
import com.oasixlab.fitpro.data.api.apiCall
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: FitProApi,
    private val tokenStore: TokenStore,
) {
    suspend fun login(email: String, password: String): User {
        val res = apiCall { api.login(LoginRequest(email = email, password = password)) }
        tokenStore.save(res.token)
        return res.user
    }

    /** null = токена нет или он протух (тогда чистим хранилище). */
    suspend fun restoreSession(): User? {
        tokenStore.current() ?: return null
        val me = apiCall { api.me() }
        if (me.user == null) tokenStore.clear()
        return me.user
    }

    suspend fun logout() = tokenStore.clear()

    /** Саморегистрация тренера. register отвечает cookie — bearer-токен добираем логином. */
    suspend fun registerTrainer(name: String, email: String, password: String): User {
        apiCall { api.register(RegisterRequest(email = email, password = password, name = name)) }
        return login(email, password)
    }

    suspend fun inviteInfo(token: String): InviteInfo =
        apiCall { api.inviteInfo(token) }.invite

    /** Клиент по инвайту: accept создаёт аккаунт, токен добираем логином. */
    suspend fun acceptInvite(token: String, email: String, password: String): User {
        apiCall { api.acceptInvite(token, AcceptInviteRequest(email = email, password = password)) }
        return login(email, password)
    }
}
