import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  LineChart,
  FileText,
  CheckSquare,
  BookOpen,
  Wallet,
  LogOut,
  Menu,
  X,
  Home,
  NotebookPen,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationsBell } from "./NotificationsBell";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  soon?: boolean;
}

const TRAINER_NAV: NavItem[] = [
  { to: "/t", label: "Главная", icon: LayoutDashboard, end: true },
  { to: "/t/clients", label: "Клиенты (CRM)", icon: Users },
  { to: "/t/exercises", label: "Упражнения", icon: Dumbbell },
  { to: "/t/templates", label: "Конструктор", icon: ClipboardList },
  { to: "/t/analytics", label: "Аналитика", icon: LineChart },
  { to: "/t/reports", label: "Отчёты", icon: FileText },
  { to: "/t/tasks", label: "Задачи", icon: CheckSquare },
  { to: "/t/knowledge", label: "База знаний", icon: BookOpen },
  { to: "/t/finance", label: "Финансы", icon: Wallet },
];

const CLIENT_NAV: NavItem[] = [
  { to: "/c", label: "Главная", icon: Home, end: true },
  { to: "/c/workouts", label: "Тренировки", icon: Dumbbell },
  { to: "/c/progress", label: "Прогресс", icon: LineChart },
  { to: "/c/profile", label: "Анкета", icon: UserCircle },
  { to: "/c/reports", label: "Отчёты", icon: NotebookPen },
  { to: "/c/tasks", label: "Привычки", icon: CheckSquare },
  { to: "/c/knowledge", label: "Материалы", icon: BookOpen },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = user?.role === "trainer" ? TRAINER_NAV : CLIENT_NAV;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navContent = (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.soon && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              скоро
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Десктоп-сайдбар */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background p-4 md:flex">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">{navContent}</div>
        <UserBox name={user?.name} role={user?.role} onLogout={handleLogout} />
      </aside>

      {/* Мобильный хедер */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Мобильное выезжающее меню */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-72 bg-background p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Brand />
            <div className="mt-6">{navContent}</div>
            <div className="mt-6">
              <UserBox name={user?.name} role={user?.role} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}

      <main className="md:pl-64">
        {/* Десктоп-топбар */}
        <header className="hidden h-14 items-center justify-end border-b bg-background px-8 md:flex">
          <NotificationsBell />
        </header>
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <EmailVerifyBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Dumbbell className="h-4 w-4" />
      </div>
      <span className="text-lg font-bold tracking-tight">FitPro</span>
    </div>
  );
}

function UserBox({
  name,
  role,
  onLogout,
}: {
  name?: string;
  role?: string;
  onLogout: () => void;
}) {
  return (
    <div className="mt-4 border-t pt-4">
      <div className="mb-2 px-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {role === "trainer" ? "Тренер" : "Клиент"}
        </p>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Выйти
      </Button>
    </div>
  );
}
