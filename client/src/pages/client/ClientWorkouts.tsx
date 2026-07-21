import { Link } from "react-router-dom";
import { Dumbbell, ChevronRight, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  EmptyState,
  ErrorBanner,
  SectionTitle,
} from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/domain";

const STATUS: Record<
  string,
  { label: string; variant: "info" | "success" | "neutral"; hint: string }
> = {
  assigned: { label: "Назначена", variant: "info", hint: "Готова к выполнению" },
  completed: { label: "Выполнена", variant: "success", hint: "Отлично, так держать" },
  skipped: { label: "Пропущена", variant: "neutral", hint: "Можно наверстать" },
};

export function ClientWorkouts() {
  const { data, loading, error, reload } = useAsync<{ workouts: Workout[] }>(() =>
    api.get("/workouts/mine"),
  );

  const assigned = data?.workouts.filter((w) => w.status === "assigned") ?? [];
  const done = data?.workouts.filter((w) => w.status !== "assigned") ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Программа"
        title="Мои тренировки"
        description="Откройте тренировку — дневник, подходы и таймер отдыха уже внутри."
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            text="Тренировок пока нет"
            hint="Как только тренер назначит программу, она появится здесь. Можно пока заполнить анкету или внести замеры."
          />
        ) : (
          <div className="space-y-6">
            {assigned.length > 0 && (
              <section>
                <SectionTitle
                  title="В плане"
                  description={`${assigned.length} ${pluralWorkouts(assigned.length)} ждут вас`}
                />
                <div className="space-y-2.5">
                  {assigned.map((w, i) => (
                    <WorkoutRow key={w.id} workout={w} primary={i === 0} />
                  ))}
                </div>
              </section>
            )}

            {done.length > 0 && (
              <section>
                <SectionTitle title="История" description="Выполненные и пропущенные" />
                <div className="space-y-2.5">
                  {done.map((w) => (
                    <WorkoutRow key={w.id} workout={w} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}
    </div>
  );
}

function pluralWorkouts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "тренировка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "тренировки";
  return "тренировок";
}

function WorkoutRow({ workout: w, primary }: { workout: Workout; primary?: boolean }) {
  const st = STATUS[w.status] ?? STATUS.assigned;
  return (
    <Link to={`/c/workouts/${w.id}`} className="block">
      <Card
        className={cn(
          "transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-panel",
          primary && "border-primary/25 bg-primary/[0.04] shadow-sm",
        )}
      >
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "icon-well h-11 w-11",
                w.status === "completed" && "from-success/20 to-success/5 text-success ring-success/15",
                w.status === "skipped" && "from-muted to-muted/50 text-muted-foreground ring-border",
              )}
            >
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{w.title ?? "Тренировка"}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 shrink-0" />
                {w.date ?? "без даты"}
                <span className="text-border">·</span>
                <span>{st.hint}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={st.variant}>{st.label}</Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
