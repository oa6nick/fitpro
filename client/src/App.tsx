import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { Spinner } from "@/components/common";

// Публичные страницы — статически: лендинг и вход открываются без ожидания чанков.
import { LandingPage } from "@/pages/LandingPage";
import { ForClientsPage } from "@/pages/ForClientsPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { JoinPage } from "@/pages/JoinPage";

// Кабинеты — лениво: recharts и тяжёлые экраны не попадают в бандл лендинга.
const TrainerDashboard = lazy(() =>
  import("@/pages/trainer/TrainerDashboard").then((m) => ({ default: m.TrainerDashboard })),
);
const ClientsPage = lazy(() =>
  import("@/pages/trainer/ClientsPage").then((m) => ({ default: m.ClientsPage })),
);
const ClientCardPage = lazy(() =>
  import("@/pages/trainer/ClientCardPage").then((m) => ({ default: m.ClientCardPage })),
);
const ExercisesPage = lazy(() =>
  import("@/pages/trainer/ExercisesPage").then((m) => ({ default: m.ExercisesPage })),
);
const TemplatesPage = lazy(() =>
  import("@/pages/trainer/TemplatesPage").then((m) => ({ default: m.TemplatesPage })),
);
const AnalyticsPage = lazy(() =>
  import("@/pages/trainer/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/trainer/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const TasksPage = lazy(() =>
  import("@/pages/trainer/TasksPage").then((m) => ({ default: m.TasksPage })),
);
const KnowledgePage = lazy(() =>
  import("@/pages/trainer/KnowledgePage").then((m) => ({ default: m.KnowledgePage })),
);
const FinancePage = lazy(() =>
  import("@/pages/trainer/FinancePage").then((m) => ({ default: m.FinancePage })),
);
const TrainerWorkoutView = lazy(() =>
  import("@/pages/trainer/TrainerWorkoutView").then((m) => ({ default: m.TrainerWorkoutView })),
);

const ClientHome = lazy(() =>
  import("@/pages/client/ClientHome").then((m) => ({ default: m.ClientHome })),
);
const ClientWorkouts = lazy(() =>
  import("@/pages/client/ClientWorkouts").then((m) => ({ default: m.ClientWorkouts })),
);
const WorkoutDiary = lazy(() =>
  import("@/pages/client/WorkoutDiary").then((m) => ({ default: m.WorkoutDiary })),
);
const ClientProgress = lazy(() =>
  import("@/pages/client/ClientProgress").then((m) => ({ default: m.ClientProgress })),
);
const ClientProfilePage = lazy(() =>
  import("@/pages/client/ClientProfilePage").then((m) => ({ default: m.ClientProfilePage })),
);
const ClientReports = lazy(() =>
  import("@/pages/client/ClientReports").then((m) => ({ default: m.ClientReports })),
);
const ClientTasks = lazy(() =>
  import("@/pages/client/ClientTasks").then((m) => ({ default: m.ClientTasks })),
);
const ClientKnowledge = lazy(() =>
  import("@/pages/client/ClientKnowledge").then((m) => ({ default: m.ClientKnowledge })),
);

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Гость видит лендинг; авторизованный — свой дашборд.
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === "trainer" ? "/t" : "/c"} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/for-clients" element={<ForClientsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/join/:token" element={<JoinPage />} />

        {/* Тренер */}
        <Route element={<ProtectedRoute role="trainer" />}>
          <Route path="/t" element={<AppLayout />}>
            <Route index element={<TrainerDashboard />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientCardPage />} />
            <Route path="exercises" element={<ExercisesPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="workouts/:id" element={<TrainerWorkoutView />} />
          </Route>
        </Route>

        {/* Клиент */}
        <Route element={<ProtectedRoute role="client" />}>
          <Route path="/c" element={<AppLayout />}>
            <Route index element={<ClientHome />} />
            <Route path="workouts" element={<ClientWorkouts />} />
            <Route path="workouts/:id" element={<WorkoutDiary />} />
            <Route path="progress" element={<ClientProgress />} />
            <Route path="profile" element={<ClientProfilePage />} />
            <Route path="reports" element={<ClientReports />} />
            <Route path="tasks" element={<ClientTasks />} />
            <Route path="knowledge" element={<ClientKnowledge />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
