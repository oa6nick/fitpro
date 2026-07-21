import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, greetingByTime } from "@/components/common";
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
  MoreHorizontal,
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
  /** Короткий label для нижней навигации. */
  short?: string;
}

const TRAINER_NAV: NavItem[] = [
  { to: "/t", label: "Главная", short: "Главная", icon: LayoutDashboard, end: true },
  { to: "/t/clients", label: "Клиенты (CRM)", short: "Клиенты", icon: Users },
  { to: "/t/exercises", label: "Упражнения", short: "Упражн.", icon: Dumbbell },
  { to: "/t/templates", label: "Конструктор", short: "Программы", icon: ClipboardList },
  { to: "/t/analytics", label: "Аналитика", short: "Аналит.", icon: LineChart },
  { to: "/t/reports", label: "Отчёты", short: "Отчёты", icon: FileText },
  { to: "/t/tasks", label: "Задачи", short: "Задачи", icon: CheckSquare },
  { to: "/t/knowledge", label: "База знаний", short: "База", icon: BookOpen },
  { to: "/t/finance", label: "Финансы", short: "Финансы", icon: Wallet },
];

const CLIENT_NAV: NavItem[] = [
  { to: "/c", label: "Главная", short: "Главная", icon: Home, end: true },
  { to: "/c/workouts", label: "Тренировки", short: "Трен.", icon: Dumbbell },
  { to: "/c/progress", label: "Прогресс", short: "Прогресс", icon: LineChart },
  { to: "/c/profile", label: "Анкета", short: "Анкета", icon: UserCircle },
  { to: "/c/reports", label: "Отчёты", short: "Отчёты", icon: NotebookPen },
  { to: "/c/tasks", label: "Привычки", short: "Привыч.", icon: CheckSquare },
  { to: "/c/knowledge", label: "Материалы", short: "Матер.", icon: BookOpen },
];

/** Основные пункты нижней мобильной навигации (остальное — «Ещё»). */
const TRAINER_BOTTOM = ["/t", "/t/clients", "/t/templates", "/t/analytics"] as const;
const CLIENT_BOTTOM = ["/c", "/c/workouts", "/c/progress", "/c/tasks"] as const;

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Мобильное меню — модальное: Escape закрывает, фокус уходит внутрь панели
  // и не убегает на контент под ней, скролл страницы замораживается.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);
  const isTrainer = user?.role === "trainer";
  const nav = isTrainer ? TRAINER_NAV : CLIENT_NAV;
  const bottomPaths = isTrainer ? TRAINER_BOTTOM : CLIENT_BOTTOM;
  const bottomItems = bottomPaths
    .map((path) => nav.find((n) => n.to === path))
    .filter(Boolean) as NavItem[];

  const moreActive = !bottomPaths.some((p) =>
    p === (isTrainer ? "/t" : "/c")
      ? location.pathname === p
      : location.pathname === p || location.pathname.startsWith(p + "/"),
  );

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const navContent = (
    <nav className="flex flex-col gap-0.5" aria-label="Основное меню">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-primary/12 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary" />
              )}
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/60 text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.soon && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  скоро
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="glass-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/50 p-4 md:flex">
        <Brand />
        <p className="mb-1 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
          {isTrainer ? "Кабинет тренера" : "Кабинет спортсмена"}
        </p>
        <div className="flex-1 overflow-y-auto pr-1">{navContent}</div>
        <UserBox name={user?.name} role={user?.role} onLogout={handleLogout} />
      </aside>

      {/* Mobile top header */}
      <header className="glass-header sticky top-0 z-20 flex items-center justify-between border-b border-border/50 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <Brand compact />
        <div className="flex items-center gap-0.5">
          <ThemeToggle />
          <NotificationsBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 animate-in fade-in-0 bg-black/50 backdrop-blur-sm duration-200" />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Меню навигации"
            className="glass-elevated absolute left-0 top-0 flex h-full w-[18.5rem] max-w-[85vw] animate-in slide-in-from-left flex-col p-4 duration-300 ease-spring"
            onClick={(e) => e.stopPropagation()}
          >
            <Brand />
            <p className="mb-1 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              {isTrainer ? "Кабинет тренера" : "Кабинет спортсмена"}
            </p>
            <div className="flex-1 overflow-y-auto">{navContent}</div>
            <div className="mt-4 border-t border-border/50 pt-4">
              <UserBox name={user?.name} role={user?.role} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <header className="glass-header sticky top-0 z-20 hidden h-14 items-center justify-end gap-1 border-b border-border/50 px-8 md:flex">
          <div className="mr-auto min-w-0">
            <p className="truncate text-sm font-medium tracking-tight">
              {greetingByTime(user?.name)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isTrainer
                ? "Сводка по клиентам и задачам на сегодня"
                : "Программа, дневник и прогресс — всегда под рукой"}
            </p>
          </div>
          <ThemeToggle />
          <NotificationsBell />
        </header>

        {/* Нижняя навигация = 4rem + вырез телефона: запас снизу считаем от него. */}
        <div className="page-enter mx-auto max-w-6xl p-4 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:p-8 md:pb-10">
          <EmailVerifyBanner />
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav
        className="bottom-nav fixed inset-x-0 bottom-0 z-30 md:hidden"
        aria-label="Быстрая навигация"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                      isActive ? "bg-primary/15 text-primary shadow-sm" : "",
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="truncate">{item.short ?? item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              moreActive ? "text-primary" : "text-muted-foreground active:text-foreground",
            )}
            aria-label="Открыть полное меню"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
                moreActive ? "bg-primary/15 text-primary shadow-sm" : "",
              )}
            >
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </span>
            <span>Ещё</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
        <Dumbbell className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-base font-bold tracking-tight">Coachly</p>
        {!compact && (
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Platform
          </p>
        )}
      </div>
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
    <div className="rounded-panel border border-border/60 bg-card/50 p-3">
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {role === "trainer" ? "Тренер" : "Спортсмен"}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Выйти
      </Button>
    </div>
  );
}
