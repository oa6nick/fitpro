import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

import { TrainerDashboard } from "@/pages/trainer/TrainerDashboard";
import { ClientsPage } from "@/pages/trainer/ClientsPage";
import { ClientCardPage } from "@/pages/trainer/ClientCardPage";
import { ExercisesPage } from "@/pages/trainer/ExercisesPage";
import { TemplatesPage } from "@/pages/trainer/TemplatesPage";
import { AnalyticsPage } from "@/pages/trainer/AnalyticsPage";
import { ReportsPage } from "@/pages/trainer/ReportsPage";
import { TasksPage } from "@/pages/trainer/TasksPage";
import { KnowledgePage } from "@/pages/trainer/KnowledgePage";
import { FinancePage } from "@/pages/trainer/FinancePage";

import { ClientHome } from "@/pages/client/ClientHome";
import { ClientWorkouts } from "@/pages/client/ClientWorkouts";
import { WorkoutDiary } from "@/pages/client/WorkoutDiary";
import { ClientProgress } from "@/pages/client/ClientProgress";
import { ClientProfilePage } from "@/pages/client/ClientProfilePage";
import { ClientReports } from "@/pages/client/ClientReports";
import { ClientTasks } from "@/pages/client/ClientTasks";
import { ClientKnowledge } from "@/pages/client/ClientKnowledge";

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  // Гость видит лендинг; авторизованный — свой дашборд.
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === "trainer" ? "/t" : "/c"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

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
  );
}
