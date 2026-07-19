package com.oasixlab.fitpro.data.api

import kotlinx.serialization.json.Json
import retrofit2.HttpException

/** Ошибка API с человекочитаемым текстом сервера ({"error": "..."} по-русски). */
class ApiException(val status: Int, override val message: String) : Exception(message)

private val errorJson = Json { ignoreUnknownKeys = true }

/** Обёртка вызовов Retrofit: HttpException → ApiException с текстом сервера. */
suspend fun <T> apiCall(block: suspend () -> T): T =
    try {
        block()
    } catch (e: HttpException) {
        val body = e.response()?.errorBody()?.string()
        val serverMessage = body?.let {
            runCatching { errorJson.decodeFromString<ApiErrorBody>(it).error }.getOrNull()
        }
        throw ApiException(e.code(), serverMessage ?: "Ошибка сети (${e.code()})")
    }
