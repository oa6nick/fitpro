import { Link } from "react-router-dom";
import { Dumbbell, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Workout } from "@/lib/domain";

const STATUS: Record<string, { label: string; variant: "info" | "success" | "neutral" }> = {
  assigned: { label: "Назначена", variant: "info" },
  completed: { label: "Выполнена", variant: "success" },
  skipped: { label: "Пропущена", variant: "neutral" },
};

export function ClientWorkouts() {
  const { data, loading, error } = useAsync<{ workouts: Workout[] }>(() =>
    api.get("/workouts/mine"),
  );

  return (
    <div>
      <PageHeader title="Мои тренировки" description="Назначенные программы и их статус." />
      {loading && <Spinner />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {data &&
        (data.workouts.length === 0 ? (
          <EmptyState text="Тренировок пока нет." />
        ) : (
          <div className="space-y-3">
            {data.workouts.map((w) => (
              <Link key={w.id} to={`/c/workouts/${w.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{w.title ?? "Тренировка"}</p>
                        <p className="text-xs text-muted-foreground">{w.date ?? "без даты"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS[w.status].variant}>{STATUS[w.status].label}</Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
