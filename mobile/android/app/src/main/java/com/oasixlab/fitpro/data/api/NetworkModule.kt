package com.oasixlab.fitpro.data.api

import com.oasixlab.fitpro.BuildConfig
import com.oasixlab.fitpro.data.auth.TokenStore
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import javax.inject.Singleton

/** Прод в release, локальный dev-сервер (10.0.2.2:4000) в debug — см. app/build.gradle.kts. */
val BASE_URL: String = BuildConfig.API_BASE_URL

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttp(tokenStore: TokenStore): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor { chain ->
                // runBlocking допустим: OkHttp вызывает интерсептор на IO-потоке.
                val token = runBlocking { tokenStore.current() }
                val request = if (token != null) {
                    chain.request().newBuilder()
                        .header("Authorization", "Bearer $token")
                        .build()
                } else {
                    chain.request()
                }
                chain.proceed(request)
            }
            .apply {
                if (BuildConfig.DEBUG) {
                    addInterceptor(
                        HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BASIC),
                    )
                }
            }
            .build()

    @Provides
    @Singleton
    fun provideApi(client: OkHttpClient): FitProApi {
        // encodeDefaults: без него kotlinx.serialization выкидывает поля с дефолтами
        // из JSON (например mobile=true в LoginRequest) — сервер не видел флаг.
        val json = Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(FitProApi::class.java)
    }
}
