import { Link } from "react-router-dom";
import {
  Dumbbell,
  Flame,
  ClipboardCheck,
  ChevronRight,
  Award,
  CalendarClock,
  UserCircle,
  LineChart,
  CheckSquare,
  BookOpen,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  PageHeader,
  Spinner,
  StatCard,
  useAsync,
  Callout,
  ErrorBanner,
  greetingByTime,
  EmptyState,
  SectionTitle,
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Client, ClientProfile, Workout, Achievement } from "@/lib/domain";

interface PaymentInfo {
  paidUntil: string | null;
  status: "paid" | "overdue";
  amount: number;
}

/** Дней до даты (отрицательное — дата прошла). */
function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

const QUICK_LINKS = [
  { to: "/c/workouts", label: "Тренировки", icon: Dumbbell, hint: "Программа и дневник" },
  { to: "/c/progress", label: "Прогресс", icon: LineChart, hint: "Замеры и графики" },
  { to: "/c/tasks", label: "Привычки", icon: CheckSquare, hint: "Недельные отметки" },
  { to: "/c/reports", label: "Отчёт", icon: NotebookPen, hint: "Форма тренеру" },
  { to: "/c/knowledge", label: "Материалы", icon: BookOpen, hint: "Гайды по этапам" },
  { to: "/c/profile", label: "Анкета", icon: UserCircle, hint: "О себе и целях" },
] as const;

export function ClientHome() {
  const { user } = useAuth();
  const me = useAsync<{
    client: Client;
    profile: ClientProfile | null;
    achievements: Achievement[];
    payment: PaymentInfo | null;
  }>(() => api.get("/me/client"));
  const workouts = useAsync<{ workouts: Workout[] }>(() => api.get("/workouts/mine"));

  if (me.loading || workouts.loading) return <Spinner />;
  if (me.error) return <ErrorBanner message={me.error} onRetry={me.reload} />;

  const client = me.data?.client;
  const profileFilled = !!me.data?.profile;
  const next = workouts.data?.workouts.find((w) => w.status === "assigned");
  const completed = workouts.data?.workouts.filter((w) => w.status === "completed").length ?? 0;
  const assigned = workouts.data?.workouts.filter((w) => w.status === "assigned").length ?? 0;

  return (
    <div className="stagger-children space-y-5">
      <PageHeader
        eyebrow="Мой кабинет"
        title={greetingByTime(user?.name)}
        description={
          next
            ? "Сегодня отличный день для тренировки — программа уже ждёт."
            : "Ваш фокус: регулярность, замеры и привычки недели."
        }
      />

      <PaymentCard payment={me.data?.payment ?? null} />

      {!profileFilled && (
        <Callout
          tone="warning"
          icon={UserCircle}
          title="Заполните анкету"
          action={
            <Button asChild size="sm">
              <Link to="/c/profile">Заполнить</Link>
            </Button>
          }
        >
          Это поможет тренеру составить программу под ваши цели, опыт и ограничения.
        </Callout>
      )}

      {/* Hero: next workout */}
      <Card className="aura-panel overflow-hidden border-primary/20 pl-1">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Ближайшая тренировка</CardTitle>
            {assigned > 0 && (
              <Badge variant="info">
                {assigned} в плане
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {next ? (
            <Link
              to={`/c/workouts/${next.id}`}
              className="surface-interactive flex items-center justify-between gap-3 border-primary/20 bg-card/90 p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="icon-well h-12 w-12 rounded-2xl shadow-glow">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{next.title ?? "Тренировка"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {next.date ?? "дата не указана"} · нажмите, чтобы открыть дневник
                  </p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                Начать
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ) : (
            <EmptyState
              icon={Sparkles}
              text="Новых тренировок пока нет"
              hint="Тренер скоро назначит программу. Пока можно заполнить анкету, внести замеры или отметить привычки."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/c/progress">Добавить замер</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="недель серии"
          value={client?.streakWeeks ?? 0}
          icon={Flame}
          tone="warning"
          hint="без пропусков подряд"
        />
        <StatCard
          label="тренировок выполнено"
          value={completed}
          icon={ClipboardCheck}
          tone="success"
          hint="за всё время"
        />
      </div>

      {(client?.goal || client?.supportEndDate) && (
        <div className="flex flex-wrap gap-2">
          {client?.goal && (
            <Badge variant="secondary" className="px-3 py-1">
              Цель: {client.goal}
            </Badge>
          )}
          {client?.supportEndDate && (
            <Badge variant="outline" className="px-3 py-1">
              Сопровождение до {client.supportEndDate}
            </Badge>
          )}
        </div>
      )}

      <div>
        <SectionTitle title="Быстрый доступ" description="Всё важное — в один тап" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="surface-interactive flex flex-col gap-2 p-3.5 sm:p-4"
            >
              <span className="icon-well h-9 w-9">
                <q.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium leading-tight">{q.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{q.hint}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {me.data?.achievements && me.data.achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-primary" />
              Достижения
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {me.data.achievements.map((a) => (
              <Badge key={a.id} variant="success" className="gap-1 px-2.5 py-1">
                <Award className="h-3 w-3" /> {a.type}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Оплаченный период: за 5 дней до конца — предупреждение, после — просрочка. */
function PaymentCard({ payment }: { payment: PaymentInfo | null }) {
  if (!payment?.paidUntil) return null;
  const left = daysUntil(payment.paidUntil);
  if (left === null) return null;

  const overdue = left < 0 || payment.status === "overdue";
  const soon = !overdue && left <= 5;

  if (!overdue && !soon) {
    return (
      <Callout tone="default" icon={CalendarClock} title={`Оплачено до ${payment.paidUntil}`}>
        Осталось {left} дн. сопровождения — всё в порядке.
      </Callout>
    );
  }

  return (
    <Callout
      tone={overdue ? "destructive" : "warning"}
      icon={CalendarClock}
      title={overdue ? "Сопровождение закончилось" : "Пора продлить"}
    >
      {overdue ? (
        <>
          Период закончился <b>{payment.paidUntil}</b>. Свяжитесь с тренером, чтобы продлить.
        </>
      ) : (
        <>
          Оплачено до <b>{payment.paidUntil}</b> — осталось <b>{left} дн.</b>
        </>
      )}
    </Callout>
  );
}
