import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  Inbox,
  CalendarClock,
  UserCheck,
  BadgeCheck,
  ChevronRight,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  StatCard,
  useAsync,
  ErrorBanner,
  EmptyHint,
  Avatar,
  SectionTitle,
  greetingByTime,
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface DashboardData {
  counts: {
    total: number;
    active: number;
    newRequests: number;
    atRisk: number;
    ending: number;
    unreviewed: number;
  };
  atRisk: { id: string; name: string; lastActivityAt: string | null }[];
  newRequests: { id: string; name: string; funnelStatus: string }[];
  ending: { id: string; name: string; daysToEnd: number | null }[];
  unreviewed: { id: string; title: string | null; date: string | null; clientName: string }[];
}

const WIDGETS = [
  { key: "total", label: "Всего клиентов", icon: Users, tone: "info" as const },
  { key: "active", label: "Активные", icon: UserCheck, tone: "success" as const },
  { key: "newRequests", label: "Новые заявки", icon: Inbox, tone: "default" as const },
  { key: "unreviewed", label: "Ждут проверки", icon: BadgeCheck, tone: "info" as const },
  { key: "atRisk", label: "Зона риска", icon: AlertTriangle, tone: "destructive" as const },
  { key: "ending", label: "Скоро конец", icon: CalendarClock, tone: "warning" as const },
] as const;

export function TrainerDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync<DashboardData>(() => api.get("/dashboard"));

  const needsAttention =
    (data?.counts.atRisk ?? 0) +
    (data?.counts.unreviewed ?? 0) +
    (data?.counts.newRequests ?? 0) +
    (data?.counts.ending ?? 0);

  return (
    <div>
      <PageHeader
        eyebrow="Обзор дня"
        title={greetingByTime(user?.name)}
        description={
          needsAttention > 0
            ? `Сегодня ${needsAttention} ${pluralAttention(needsAttention)} — начните с них.`
            : "Всё спокойно: клиенты в порядке. Можно планировать новые программы."
        }
        action={
          <Button asChild>
            <Link to="/t/clients">
              <Plus className="h-4 w-4" /> Новый клиент
            </Link>
          </Button>
        }
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data && (
        <div className="stagger-children space-y-6">
          <div className="aura-panel -mx-1 rounded-hero px-1 pb-1 pt-0.5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {WIDGETS.map((w) => (
              <StatCard
                key={w.key}
                label={w.label}
                value={data.counts[w.key] ?? 0}
                icon={w.icon}
                tone={w.tone}
              />
            ))}
          </div>
          </div>

          {data.counts.total === 0 && (
            <Card className="border-primary/25">
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="type-eyebrow mb-2">Старт за 10 минут</p>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Добро пожаловать в Coachly
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Четыре шага — и вы ведёте клиентов лучше, чем в чатах и таблицах.
                  </p>
                </div>
                <ol className="space-y-3">
                  {[
                    {
                      n: "1",
                      t: "Добавьте клиента",
                      d: "Карточка + ссылка-приглашение в кабинет",
                      to: "/t/clients",
                    },
                    {
                      n: "2",
                      t: "База упражнений",
                      d: "Техника, видео, мышцы — один раз",
                      to: "/t/exercises",
                    },
                    {
                      n: "3",
                      t: "Соберите программу",
                      d: "Подходы, повторы, отдых 30с–5м",
                      to: "/t/templates",
                    },
                    {
                      n: "4",
                      t: "Смотрите прогресс",
                      d: "Тоннаж, 1ПМ, зона риска на главной",
                      to: "/t/analytics",
                    },
                  ].map((s) => (
                    <li key={s.n}>
                      <Link
                        to={s.to}
                        className="surface-interactive flex items-start gap-3 p-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                          {s.n}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">{s.t}</span>
                          <span className="text-xs text-muted-foreground">{s.d}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/t/clients">
                    <Plus className="h-4 w-4" /> Добавить первого клиента
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {data.unreviewed?.length > 0 && (
            <Card className="border-info/25 bg-info/[0.04]">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base">Ждут вашей проверки</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Клиенты ждут обратной связи по тренировкам
                  </p>
                </div>
                <BadgeCheck className="h-5 w-5 text-info" />
              </CardHeader>
              <CardContent className="space-y-2">
                {data.unreviewed.map((w) => (
                  <Link
                    key={w.id}
                    to={`/t/workouts/${w.id}`}
                    className="surface-interactive flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={w.clientName} size="sm" />
                      <span className="truncate font-medium">
                        {w.clientName}
                        {w.title ? ` · ${w.title}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      {w.date ?? ""}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {data.counts.total > 0 && (
            <>
              <SectionTitle
                title="Где нужно внимание"
                description="Риск, новые заявки и окончания сопровождения"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <ListCard
                  title="Зона риска"
                  empty="Нет клиентов в зоне риска — отличная работа"
                  tone="destructive"
                  icon={AlertTriangle}
                >
                  {data.atRisk.map((c) => (
                    <ClientRow
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      hint="нет активности 7+ дней"
                    />
                  ))}
                </ListCard>
                <ListCard
                  title="Новые заявки и анкеты"
                  empty="Новых заявок нет"
                  tone="default"
                  icon={Inbox}
                >
                  {data.newRequests.map((c) => (
                    <ClientRow key={c.id} id={c.id} name={c.name} hint="ожидает обработки" />
                  ))}
                </ListCard>
                <ListCard
                  title="Заканчивается сопровождение"
                  empty="Ближайших окончаний нет"
                  tone="warning"
                  icon={CalendarClock}
                >
                  {data.ending.map((c) => (
                    <ClientRow
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      hint={c.daysToEnd === 0 ? "сегодня" : `через ${c.daysToEnd} дн.`}
                    />
                  ))}
                </ListCard>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function pluralAttention(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "точка внимания";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "точки внимания";
  return "точек внимания";
}

function ListCard({
  title,
  empty,
  children,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive" | "warning";
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.flat().filter(Boolean).length > 0;
  const iconTone =
    tone === "destructive"
      ? "text-destructive bg-destructive/12"
      : tone === "warning"
        ? "text-warning bg-warning/12"
        : "text-primary bg-primary/12";

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2.5 space-y-0 pb-3">
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconTone}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasItems ? (
          children
        ) : (
          <EmptyHint className="py-4">{empty}</EmptyHint>
        )}
      </CardContent>
    </Card>
  );
}

function ClientRow({ id, name, hint }: { id: string; name: string; hint: string }) {
  return (
    <Link
      to={`/t/clients/${id}`}
      className="surface-interactive flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar name={name} size="sm" />
        <span className="truncate font-medium">{name}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        {hint}
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
      </span>
    </Link>
  );
}
