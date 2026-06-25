import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, PlayCircle, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FEELING_LABELS, type Workout, type WorkoutExerciseRow } from "@/lib/domain";

interface DiaryData {
  workout: Workout;
  items: WorkoutExerciseRow[];
}

export function WorkoutDiary() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<DiaryData>(
    () => api.get(`/workouts/${id}`),
    [id],
  );

  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Не найдено"}</p>;

  const { workout, items } = data;

  async function setStatus(status: "completed" | "skipped") {
    await api.patch(`/workouts/${id}/status`, { status });
    reload();
  }

  return (
    <div>
      <Link
        to="/c/workouts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> К тренировкам
      </Link>
      <PageHeader
        title={workout.title ?? "Тренировка"}
        description={workout.date ?? undefined}
        action={
          workout.status === "completed" ? (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" /> Выполнена
            </Badge>
          ) : (
            <Button onClick={() => setStatus("completed")}>
              <Check className="h-4 w-4" /> Завершить тренировку
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {items.map((item) => (
          <ExerciseBlock key={item.id} workoutId={id!} item={item} onLogged={reload} />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">В тренировке нет упражнений.</p>
        )}
      </div>
    </div>
  );
}

function ExerciseBlock({
  workoutId,
  item,
  onLogged,
}: {
  workoutId: string;
  item: WorkoutExerciseRow;
  onLogged: () => void;
}) {
  const nextSet = item.logs.length + 1;
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState(item.reps ?? "");
  const [feel, setFeel] = useState<string>("moderate");
  const [busy, setBusy] = useState(false);

  async function logSet() {
    setBusy(true);
    await api.post(`/workouts/${workoutId}/log`, {
      workoutExerciseId: item.id,
      setNumber: nextSet,
      weight: weight ? Number(weight) : undefined,
      reps: reps ? Number(reps) : undefined,
      feeling: feel,
    });
    setBusy(false);
    setWeight("");
    onLogged();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{item.exercise.name}</CardTitle>
          {item.exercise.videoUrl && (
            <a
              href={item.exercise.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <PlayCircle className="h-4 w-4" /> Видео
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          План: {item.sets ?? "?"} × {item.reps ?? "?"}
          {item.weight ? `, ${item.weight}` : ""}
          {item.rest ? ` · отдых ${item.rest}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.exercise.keyHints && (
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            💡 {item.exercise.keyHints}
          </p>
        )}

        {item.logs.length > 0 && (
          <div className="space-y-1">
            {item.logs.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
              >
                <span className="font-medium">Подход {l.setNumber}</span>
                <span className="text-muted-foreground">
                  {l.weight ?? "—"} кг × {l.reps ?? "—"}
                </span>
                {l.feeling && (
                  <Badge variant="outline">{FEELING_LABELS[l.feeling]}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <div className="w-20">
            <label className="text-xs text-muted-foreground">Вес, кг</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-muted-foreground">Повторы</label>
            <Input type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground">Ощущения</label>
            <Select value={feel} onValueChange={setFeel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FEELING_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={logSet} disabled={busy}>
            <Plus className="h-4 w-4" /> Подход {nextSet}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
