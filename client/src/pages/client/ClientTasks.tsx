import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
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

export function ClientTasks() {
  const { data, loading, reload } = useAsync<{ weekStart: string; tasks: TaskWeekItem[] }>(() =>
    api.get("/tasks/mine"),
  );

  async function toggle(assignmentId: string, date: string, done: boolean) {
    await api.post(`/tasks/${assignmentId}/toggle`, { date, done });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Привычки недели"
        description="Отмечайте выполнение по дням — тренер видит ваш % соблюдения."
      />
      {loading && <Spinner />}
      {data &&
        (data.tasks.length === 0 ? (
          <EmptyState text="На эту неделю задач нет." />
        ) : (
          <div className="space-y-3">
            {data.tasks.map((t) => {
              const dates = weekDates(t.weekStart);
              return (
                <Card key={t.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{t.title}</CardTitle>
                      <span className="text-sm font-medium text-primary">{t.compliance}%</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1.5">
                      {dates.map((date, i) => {
                        const done = t.doneDays.includes(date);
                        return (
                          <button
                            key={date}
                            onClick={() => toggle(t.id, date, !done)}
                            className={cn(
                              "flex h-12 flex-1 flex-col items-center justify-center rounded-lg border text-xs transition-colors",
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:bg-accent",
                            )}
                          >
                            <span className="font-medium">{DAY_LABELS[i]}</span>
                            <span>{date.slice(8, 10)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
    </div>
  );
}
