package com.oasixlab.fitpro.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface FitProApi {
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("api/auth/me")
    suspend fun me(): MeResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): UserResponse

    @GET("api/auth/invite/{token}")
    suspend fun inviteInfo(@Path("token") token: String): InviteInfoResponse

    @POST("api/auth/invite/{token}/accept")
    suspend fun acceptInvite(
        @Path("token") token: String,
        @Body body: AcceptInviteRequest,
    ): UserResponse

    /* Тренировки (client) */

    @GET("api/workouts/mine")
    suspend fun myWorkouts(): WorkoutsResponse

    @GET("api/workouts/{id}")
    suspend fun workout(@Path("id") id: String): WorkoutDetailResponse

    @POST("api/workouts/{id}/log")
    suspend fun logSet(@Path("id") id: String, @Body body: LogSetRequest): LogSetResponse

    @HTTP(method = "DELETE", path = "api/workouts/{id}/log", hasBody = true)
    suspend fun deleteLog(@Path("id") id: String, @Body body: DeleteLogRequest): OkResponse

    @PATCH("api/workouts/{id}/status")
    suspend fun setWorkoutStatus(
        @Path("id") id: String,
        @Body body: WorkoutStatusRequest,
    ): WorkoutStatusResponse

    /* Замеры */

    @GET("api/measurements")
    suspend fun measurements(): MeasurementsResponse

    @POST("api/measurements")
    suspend fun addMeasurement(@Body body: CreateMeasurementRequest): MeasurementResponse

    /* Привычки недели */

    @GET("api/tasks/mine")
    suspend fun myTasks(@Query("weekStart") weekStart: String? = null): TasksResponse

    @POST("api/tasks/{assignmentId}/toggle")
    suspend fun toggleTask(
        @Path("assignmentId") assignmentId: String,
        @Body body: ToggleTaskRequest,
    ): OkResponse

    /* Материалы */

    @GET("api/knowledge/mine")
    suspend fun myKnowledge(): KnowledgeResponse

    /* Сводка клиента */

    @GET("api/me/client")
    suspend fun clientSummary(): ClientSummaryResponse

    /* Push-токены устройств */

    @POST("api/push/device")
    suspend fun registerDevice(@Body body: DeviceTokenRequest): OkResponse

    @HTTP(method = "DELETE", path = "api/push/device", hasBody = true)
    suspend fun unregisterDevice(@Body body: DeviceTokenRequest): OkResponse

    /* Кабинет тренера */

    @GET("api/dashboard")
    suspend fun dashboard(): DashboardResponse

    @GET("api/clients")
    suspend fun trainerClients(): TrainerClientsResponse

    @GET("api/clients/{id}")
    suspend fun clientDetail(@Path("id") id: String): ClientDetailResponse

    @PATCH("api/workouts/{id}/review")
    suspend fun reviewWorkout(
        @Path("id") id: String,
        @Body body: ReviewWorkoutRequest,
    ): WorkoutResponse

    @GET("api/reports/submissions")
    suspend fun trainerSubmissions(@Query("status") status: String? = null): TrainerSubmissionsResponse

    @GET("api/reports/submissions/{id}")
    suspend fun submissionDetail(@Path("id") id: String): SubmissionDetailResponse

    @PATCH("api/reports/submissions/{id}/review")
    suspend fun reviewSubmission(
        @Path("id") id: String,
        @Body body: EmptyBody = EmptyBody(),
    ): SubmissionResponse

    /* Файлы */

    @Multipart
    @POST("api/uploads")
    suspend fun upload(@Part file: okhttp3.MultipartBody.Part): UploadResponse

    /* Отчёты */

    @GET("api/reports/my-form")
    suspend fun myReportForm(): MyFormResponse

    @GET("api/reports/mine")
    suspend fun myReports(): SubmissionsResponse

    @POST("api/reports/submit")
    suspend fun submitReport(@Body body: SubmitReportRequest): SubmitReportResponse

    /* Уведомления */

    @GET("api/notifications")
    suspend fun notifications(): NotificationsResponse

    @POST("api/notifications/read-all")
    suspend fun readAllNotifications(): OkResponse
}
