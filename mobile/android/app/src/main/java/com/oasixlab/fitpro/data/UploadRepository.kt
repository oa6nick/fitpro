package com.oasixlab.fitpro.data

import android.content.Context
import android.net.Uri
import com.oasixlab.fitpro.data.api.FitProApi
import com.oasixlab.fitpro.data.api.apiCall
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

/** Загрузка фото в /api/uploads (сервер: multipart-поле "file", лимит 15 МБ). */
@Singleton
class UploadRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val api: FitProApi,
) {
    /** Возвращает относительный URL вида /uploads/<имя>. */
    suspend fun uploadImage(uri: Uri): String = withContext(Dispatchers.IO) {
        val resolver = context.contentResolver
        val mime = resolver.getType(uri) ?: "image/jpeg"
        val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalStateException("Не удалось прочитать файл")
        val ext = when (mime) {
            "image/png" -> "png"
            "image/webp" -> "webp"
            else -> "jpg"
        }
        val part = MultipartBody.Part.createFormData(
            name = "file",
            filename = "photo.$ext",
            body = bytes.toRequestBody(mime.toMediaTypeOrNull()),
        )
        apiCall { api.upload(part) }.url
    }

    // Произвольный файл: сервер принимает image, application/pdf и video любых подтипов.
    suspend fun uploadFile(uri: Uri): String = withContext(Dispatchers.IO) {
        val resolver = context.contentResolver
        val mime = resolver.getType(uri) ?: "application/octet-stream"
        val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalStateException("Не удалось прочитать файл")
        val part = MultipartBody.Part.createFormData(
            name = "file",
            filename = uri.lastPathSegment ?: "file",
            body = bytes.toRequestBody(mime.toMediaTypeOrNull()),
        )
        apiCall { api.upload(part) }.url
    }
}
