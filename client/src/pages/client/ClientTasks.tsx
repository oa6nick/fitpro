import { Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  EmptyState,
  ErrorBanner,
  ProgressRing,
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskWeekItem } from "@/lib/domain";

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function weekDates(weekStart: string): string[] {
  const start = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatWeekRange(weekStart: string): string {
  try {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    return `${fmt(start)} — ${fmt(end)}`;
  } catch {
    return weekStart;
  }
}

export function ClientTasks() {
  const { data, loading, error, reload } = useAsync<{
    weekStart: string;
    tasks: TaskWeekItem[];
  }>(() => api.get("/tasks/mine"));

  async function toggle(assignmentId: string, date: string, done: boolean) {
    await api.post(`/tasks/${assignmentId}/toggle`, { date, done });
    reload();
  }

  const avg =
    data && data.tasks.length > 0
      ? Math.round(
          data.tasks.reduce((s, t) => s + (t.compliance ?? 0), 0) / data.tasks.length,
        )
      : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Сопровождение"
        title="Привычки недели"
        description="Отмечайте дни одним тапом — тренер видит % соблюдения в реальном времени."
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.tasks.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            text="На эту неделю задач нет"
            hint="Тренер назначит привычки (шаги, вода, сон) — они появятся здесь с отметками по дням."
          />
        ) : (
          <div className="space-y-4">
            <Card className="border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <ProgressRing value={avg} size={56} stroke={5}>
                  <span className="text-xs font-bold text-primary">{avg}%</span>
                </ProgressRing>
                <div>
                  <p className="text-sm font-semibold">Соблюдение недели</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatWeekRange(data.weekStart)} · {data.tasks.length}{" "}
                    {data.tasks.length === 1 ? "привычка" : "привычки"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {data.tasks.map((t) => {
                const dates = weekDates(t.weekStart);
                return (
                  <Card key={t.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base leading-snug">{t.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <ProgressRing value={t.compliance} size={40} stroke={3.5}>
                            <span className="text-[10px] font-bold tabular-nums">
                              {t.compliance}%
                            </span>
                          </ProgressRing>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1.5">
                        {dates.map((date, i) => {
                          const done = t.doneDays.includes(date);
                          const isToday =
                            date === new Date().toISOString().slice(0, 10);
                          return (
                            <button
                              key={date}
                              type="button"
                              onClick={() => toggle(t.id, date, !done)}
                              aria-pressed={done}
                              aria-label={`${DAY_LABELS[i]} ${date.slice(8, 10)}: ${done ? "выполнено" : "не отмечено"}`}
                              className={cn(
                                "day-toggle relative",
                                done && "day-toggle-on",
                                isToday && !done && "ring-2 ring-primary/25 ring-offset-1 ring-offset-background",
                              )}
                            >
                              <span className="font-semibold">{DAY_LABELS[i]}</span>
                              <span className={cn("opacity-80", done && "opacity-90")}>
                                {date.slice(8, 10)}
                              </span>
                              {done && (
                                <Check
                                  className="absolute right-1 top-1 h-2.5 w-2.5 opacity-80"
                                  strokeWidth={3}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
