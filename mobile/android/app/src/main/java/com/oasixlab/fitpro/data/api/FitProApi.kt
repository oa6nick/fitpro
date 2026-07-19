package com.oasixlab.fitpro.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
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

    /* Конструкторы тренера */

    @GET("api/trainer/subscription")
    suspend fun trainerSubscription(): TrainerSubscriptionResponse

    @GET("api/billing/plans")
    suspend fun billingPlans(): BillingPlansResponse

    @POST("api/billing/subscribe")
    suspend fun subscribe(@Body body: SubscribeRequest): SubscribeResponse

    @POST("api/clients")
    suspend fun createClient(@Body body: ClientUpsertRequest): TrainerClientResponse

    @PATCH("api/clients/{id}")
    suspend fun updateClient(
        @Path("id") id: String,
        @Body body: ClientUpsertRequest,
    ): TrainerClientResponse

    @PATCH("api/clients/{id}/status")
    suspend fun setClientStatus(
        @Path("id") id: String,
        @Body body: FunnelStatusRequest,
    ): TrainerClientResponse

    @HTTP(method = "DELETE", path = "api/clients/{id}")
    suspend fun deleteClient(@Path("id") id: String): OkResponse

    @POST("api/clients/{id}/invite")
    suspend fun createInvite(
        @Path("id") id: String,
        @Body body: InviteCreateRequest = InviteCreateRequest(),
    ): InviteLinkResponse

    @POST("api/clients/{id}/notes")
    suspend fun addNote(@Path("id") id: String, @Body body: NoteRequest): NoteResponse

    @HTTP(method = "DELETE", path = "api/clients/{id}/notes/{noteId}")
    suspend fun deleteNote(@Path("id") id: String, @Path("noteId") noteId: String): OkResponse

    @PUT("api/clients/{id}/profile")
    suspend fun updateClientProfile(
        @Path("id") id: String,
        @Body body: ClientProfile,
    ): ClientProfileResponse

    @PUT("api/me/profile")
    suspend fun updateMyProfile(@Body body: ClientProfile): ClientProfileResponse

    @GET("api/exercises")
    suspend fun exercises(): ExercisesResponse

    @POST("api/exercises")
    suspend fun createExercise(@Body body: ExerciseUpsertRequest): ExerciseResponse

    @PATCH("api/exercises/{id}")
    suspend fun updateExercise(
        @Path("id") id: String,
        @Body body: ExerciseUpsertRequest,
    ): ExerciseResponse

    @HTTP(method = "DELETE", path = "api/exercises/{id}")
    suspend fun deleteExercise(@Path("id") id: String): OkResponse

    @GET("api/templates")
    suspend fun templates(): TemplatesResponse

    @GET("api/templates/{id}")
    suspend fun template(@Path("id") id: String): TemplateDetailResponse

    @POST("api/templates")
    suspend fun createTemplate(@Body body: TemplateUpsertRequest): TemplateResponse

    @PUT("api/templates/{id}")
    suspend fun updateTemplate(
        @Path("id") id: String,
        @Body body: TemplateUpsertRequest,
    ): OkResponse

    @HTTP(method = "DELETE", path = "api/templates/{id}")
    suspend fun deleteTemplate(@Path("id") id: String): OkResponse

    @POST("api/workouts")
    suspend fun assignWorkout(@Body body: AssignWorkoutRequest): WorkoutResponse

    @GET("api/tasks/habits")
    suspend fun habits(): HabitsResponse

    @POST("api/tasks/habits")
    suspend fun createHabit(@Body body: HabitRequest): HabitResponse

    @HTTP(method = "DELETE", path = "api/tasks/habits/{id}")
    suspend fun deleteHabit(@Path("id") id: String): OkResponse

    @POST("api/tasks/assign")
    suspend fun assignHabit(@Body body: AssignHabitRequest): OkResponse

    @GET("api/knowledge")
    suspend fun knowledgeAdmin(): KnowledgeAdminResponse

    @POST("api/knowledge")
    suspend fun createKnowledge(@Body body: KnowledgeCreateRequest): KnowledgeItemResponse

    @HTTP(method = "DELETE", path = "api/knowledge/{id}")
    suspend fun deleteKnowledge(@Path("id") id: String): OkResponse

    @GET("api/reports/forms")
    suspend fun reportForms(): ReportFormsResponse

    @POST("api/reports/forms")
    suspend fun createReportForm(@Body body: ReportFormCreateRequest): ReportFormResponse

    @HTTP(method = "DELETE", path = "api/reports/forms/{id}")
    suspend fun deleteReportForm(@Path("id") id: String): OkResponse

    @GET("api/finance")
    suspend fun finance(): FinanceResponse

    @POST("api/finance")
    suspend fun addPayment(@Body body: PaymentCreateRequest): PaymentResponse

    @POST("api/finance/{id}/remind")
    suspend fun remindPayment(@Path("id") id: String): OkResponse

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
