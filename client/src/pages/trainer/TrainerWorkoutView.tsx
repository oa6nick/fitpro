import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Check, Dumbbell, X } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, ErrorBanner, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEELING_LABELS, type Workout, type WorkoutExerciseRow } from "@/lib/domain";

interface DiaryData {
  workout: Workout & {
    reviewStatus: "none" | "pending" | "reviewed";
    trainerComment: string | null;
    reviewedAt: string | null;
  };
  items: WorkoutExerciseRow[];
}

/** Тренер смотрит выполненную тренировку клиента: подходы, тоннаж, обратную связь. */
export function TrainerWorkoutView() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<DiaryData>(
    () => api.get(`/workouts/${id}`),
    [id],
  );
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBanner message={error ?? "Не найдено"} onRetry={reload} />;

  const { workout, items } = data;
  const reviewed = workout.reviewStatus === "reviewed";

  async function review() {
    setBusy(true);
    try {
      await api.patch(`/workouts/${id}/review`, { comment: comment || undefined });
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Link
        to="/t"
        className="mb-4 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> На главную
      </Link>
      <PageHeader
        eyebrow="Проверка тренировки"
        title={workout.title ?? "Тренировка"}
        description={workout.date ?? undefined}
        action={
          reviewed ? (
            <Badge variant="success" className="gap-1">
              <BadgeCheck className="h-3 w-3" /> Проверена
            </Badge>
          ) : workout.reviewStatus === "pending" ? (
            <Badge variant="warning">Ожидает проверки</Badge>
          ) : (
            <Badge variant="neutral">{workout.status === "skipped" ? "Пропущена" : "Назначена"}</Badge>
          )
        }
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Тоннаж:</span>
              <b className="tabular-nums">
                {Math.round(workout.tonnage ?? 0).toLocaleString("ru-RU")} кг
              </b>
            </span>
            {workout.clientFeeling && (
              <span className="text-muted-foreground">
                Самочувствие:{" "}
                <b className="text-foreground">{FEELING_LABELS[workout.clientFeeling]}</b>
              </span>
            )}
          </CardContent>
        </Card>

        {workout.clientComment && (
          <Card>
            <CardContent className="p-4 text-sm">
              <p className="type-caption mb-1">Комментарий клиента</p>
              <p>{workout.clientComment}</p>
            </CardContent>
          </Card>
        )}

        {items.map((item) => {
          const planned = item.sets ?? 0;
          const done = item.logs.length;
          return (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{item.exercise.name}</CardTitle>
                  <Badge variant={done >= planned && done > 0 ? "success" : "warning"}>
                    {done} / {planned || done}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  План: {item.sets ?? "?"} × {item.reps ?? "?"}
                  {item.rest ? ` · отдых ${item.rest}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {Array.from({ length: Math.max(planned, done) }, (_, i) => {
                  const setNumber = i + 1;
                  const log = item.logs.find((l) => l.setNumber === setNumber);
                  return (
                    <div
                      key={setNumber}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-sm ${
                        log ? "border-success/40 bg-success/8" : "border-dashed border-border"
                      }`}
                    >
                      {log ? (
                        <Check className="h-4 w-4 shrink-0 text-success" aria-label="Выполнен" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Не выполнен" />
                      )}
                      <span className="w-20 text-muted-foreground">Подход {setNumber}</span>
                      {log ? (
                        <>
                          <span className="tabular-nums">
                            {log.weight ?? "—"} кг × {log.reps ?? "—"}
                          </span>
                          {log.feeling && (
                            <Badge variant="outline">{FEELING_LABELS[log.feeling]}</Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">не выполнен</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && <EmptyState icon={Dumbbell} text="В тренировке нет упражнений" />}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {reviewed ? "Ваш комментарий" : "Проверка"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewed ? (
              <p className="text-sm">
                {workout.trainerComment || (
                  <span className="text-muted-foreground">Без комментария</span>
                )}
              </p>
            ) : (
              <>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Комментарий клиенту: что получилось, что поправить…"
                  aria-label="Комментарий тренера"
                />
                <Button onClick={review} disabled={busy}>
                  <BadgeCheck className="h-4 w-4" /> {busy ? "Сохраняем…" : "Отметить проверенной"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
