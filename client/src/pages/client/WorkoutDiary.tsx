import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCheck,
  Dumbbell,
  PlayCircle,
  Plus,
  Repeat,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync } from "@/components/common";
import { RestTimer } from "@/components/RestTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FEELING_LABELS,
  GROUP_LABELS,
  type Exercise,
  type Feeling,
  type GroupType,
  type Workout,
  type WorkoutExerciseRow,
} from "@/lib/domain";

interface DiaryData {
  workout: Workout;
  items: WorkoutExerciseRow[];
}

const draftKey = (weId: string, set: number) => `fitpro-draft:${weId}:${set}`;

/** План повторов может быть диапазоном («8-10») — в числовое поле берём нижнюю границу. */
const plannedReps = (reps: string | null) => reps?.match(/\d+/)?.[0] ?? "";

interface ItemGroup {
  groupKey: string | null;
  groupType: GroupType | null;
  items: WorkoutExerciseRow[];
}

/** Соседние упражнения с одинаковым groupKey объединяются в связку. */
function groupItems(items: WorkoutExerciseRow[]): ItemGroup[] {
  const groups: ItemGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (item.groupKey && last?.groupKey === item.groupKey) {
      last.items.push(item);
    } else {
      groups.push({ groupKey: item.groupKey, groupType: item.groupType, items: [item] });
    }
  }
  return groups;
}

export function WorkoutDiary() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<DiaryData>(
    () => api.get(`/workouts/${id}`),
    [id],
  );
  const [finishOpen, setFinishOpen] = useState(false);

  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Не найдено"}</p>;

  const { workout, items } = data;
  const done = workout.status === "completed";

  // Незаполненные подходы = плановые слоты без записи.
  const missing = items.reduce(
    (sum, it) => sum + Math.max(0, (it.sets ?? 0) - it.logs.length),
    0,
  );
  const liveTonnage = items.reduce(
    (sum, it) => sum + it.logs.reduce((s, l) => s + (l.weight ?? 0) * (l.reps ?? 0), 0),
    0,
  );

  return (
    <div>
      <Link
        to="/c/workouts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> К тренировкам
      </Link>
      <PageHeader
        eyebrow="Дневник"
        title={workout.title ?? "Тренировка"}
        description={workout.date ?? undefined}
        action={
          done ? (
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" /> Выполнена
            </Badge>
          ) : (
            <Button onClick={() => setFinishOpen(true)}>
              <Check className="h-4 w-4" /> Завершить тренировку
            </Button>
          )
        }
      />

      {(done || liveTonnage > 0) && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm">
            <span className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Тоннаж:</span>
              <b className="tabular-nums">
                {Math.round(workout.tonnage ?? liveTonnage).toLocaleString("ru-RU")} кг
              </b>
            </span>
            {workout.clientFeeling && (
              <span className="text-muted-foreground">
                Самочувствие: <b className="text-foreground">{FEELING_LABELS[workout.clientFeeling]}</b>
              </span>
            )}
            {!done && missing > 0 && (
              <span className="text-muted-foreground">
                Осталось подходов: <b className="text-foreground tabular-nums">{missing}</b>
              </span>
            )}
          </CardContent>
        </Card>
      )}

      {workout.reviewStatus === "reviewed" && (
        <Card className="mb-4 border-success/40 bg-success/5">
          <CardContent className="p-4 text-sm">
            <p className="type-caption mb-1 flex items-center gap-1.5 text-success">
              <BadgeCheck className="h-3.5 w-3.5" /> Тренер проверил тренировку
            </p>
            <p>
              {workout.trainerComment || (
                <span className="text-muted-foreground">Без комментария</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {workout.status === "completed" && workout.reviewStatus === "pending" && (
        <p className="mb-4 text-sm text-muted-foreground">Тренировка отправлена тренеру на проверку.</p>
      )}

      {workout.clientComment && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm">
            <p className="type-caption mb-1">Ваш комментарий</p>
            <p>{workout.clientComment}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {groupItems(items).map((group) =>
          group.groupKey ? (
            <div
              key={group.groupKey}
              className="rounded-hero border-2 border-dashed border-primary/30 p-3"
            >
              <p className="type-caption mb-2 text-primary">
                {GROUP_LABELS[group.groupType ?? "superset"]} · выполняйте по кругу без отдыха
              </p>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <ExerciseBlock
                    key={item.id}
                    workoutId={id!}
                    item={item}
                    readOnly={done}
                    onChanged={reload}
                  />
                ))}
              </div>
            </div>
          ) : (
            group.items.map((item) => (
              <ExerciseBlock
                key={item.id}
                workoutId={id!}
                item={item}
                readOnly={done}
                onChanged={reload}
              />
            ))
          ),
        )}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">В тренировке нет упражнений.</p>
        )}
      </div>

      <FinishDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        workoutId={id!}
        missing={missing}
        tonnage={liveTonnage}
        onDone={reload}
      />
    </div>
  );
}

/** Слот подхода: значения в форме + отметка «выполнен» (= есть запись в БД). */
interface Slot {
  setNumber: number;
  weight: string;
  reps: string;
  feeling: Feeling;
  done: boolean;
}

function buildSlots(item: WorkoutExerciseRow): Slot[] {
  const planned = item.sets ?? 0;
  const maxLogged = item.logs.reduce((m, l) => Math.max(m, l.setNumber), 0);
  const count = Math.max(planned, maxLogged, 1);

  return Array.from({ length: count }, (_, i) => {
    const setNumber = i + 1;
    const log = item.logs.find((l) => l.setNumber === setNumber);
    if (log) {
      return {
        setNumber,
        weight: log.weight?.toString() ?? "",
        reps: log.reps?.toString() ?? "",
        feeling: log.feeling ?? "moderate",
        done: true,
      };
    }
    // Черновик переживает снятие галочки и перезагрузку.
    let draft: Partial<Slot> = {};
    try {
      const raw = localStorage.getItem(draftKey(item.id, setNumber));
      if (raw) draft = JSON.parse(raw);
    } catch {
      /* ок */
    }
    return {
      setNumber,
      weight: draft.weight ?? "",
      reps: draft.reps ?? plannedReps(item.reps),
      feeling: draft.feeling ?? "moderate",
      done: false,
    };
  });
}

function ExerciseBlock({
  workoutId,
  item,
  readOnly,
  onChanged,
}: {
  workoutId: string;
  item: WorkoutExerciseRow;
  readOnly: boolean;
  onChanged: () => void;
}) {
  const [slots, setSlots] = useState<Slot[]>(() => buildSlots(item));
  const [busy, setBusy] = useState(false);

  // Пересобираем слоты, когда с сервера пришли новые логи.
  useEffect(() => setSlots(buildSlots(item)), [item]);

  const doneCount = slots.filter((s) => s.done).length;

  function patchSlot(setNumber: number, patch: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.setNumber !== setNumber) return s;
        const next = { ...s, ...patch };
        if (!next.done) {
          try {
            localStorage.setItem(
              draftKey(item.id, setNumber),
              JSON.stringify({ weight: next.weight, reps: next.reps, feeling: next.feeling }),
            );
          } catch {
            /* ок */
          }
        }
        return next;
      }),
    );
  }

  async function toggle(slot: Slot) {
    setBusy(true);
    try {
      if (slot.done) {
        await api.delete(`/workouts/${workoutId}/log`, {
          workoutExerciseId: item.id,
          setNumber: slot.setNumber,
        });
      } else {
        await api.post(`/workouts/${workoutId}/log`, {
          workoutExerciseId: item.id,
          setNumber: slot.setNumber,
          weight: slot.weight ? Number(slot.weight) : undefined,
          reps: slot.reps ? Number(slot.reps) : undefined,
          feeling: slot.feeling,
        });
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  /** Отметить все незаполненные подходы разом. */
  async function completeAll() {
    setBusy(true);
    try {
      for (const s of slots.filter((x) => !x.done)) {
        await api.post(`/workouts/${workoutId}/log`, {
          workoutExerciseId: item.id,
          setNumber: s.setNumber,
          weight: s.weight ? Number(s.weight) : undefined,
          reps: s.reps ? Number(s.reps) : undefined,
          feeling: s.feeling,
        });
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  /** «+4 подхода»: добавляем слоты, заполнив по аналогии с последним. */
  function addSets(n: number) {
    setSlots((prev) => {
      const last = prev[prev.length - 1];
      const start = prev.length;
      const extra = Array.from({ length: n }, (_, i) => ({
        setNumber: start + i + 1,
        weight: last?.weight ?? "",
        reps: last?.reps || plannedReps(item.reps),
        feeling: last?.feeling ?? ("moderate" as Feeling),
        done: false,
      }));
      return [...prev, ...extra];
    });
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{item.exercise.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={doneCount >= (item.sets ?? 0) && doneCount > 0 ? "success" : "neutral"}>
              {doneCount} / {item.sets ?? slots.length}
            </Badge>
            {!readOnly && item.logs.length === 0 && (
              <ReplaceExercise
                workoutId={workoutId}
                weId={item.id}
                currentName={item.exercise.name}
                onReplaced={onChanged}
              />
            )}
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
        </div>
        <p className="text-sm text-muted-foreground">
          План: {item.sets ?? "?"} × {item.reps ?? "?"}
          {item.weight ? `, ${item.weight}` : ""}
          {item.rest ? ` · отдых ${item.rest}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.exercise.keyHints && (
          <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
            💡 {item.exercise.keyHints}
          </p>
        )}

        <div className="space-y-2">
          {slots.map((s) => (
            <SlotRow
              key={s.setNumber}
              slot={s}
              readOnly={readOnly}
              busy={busy}
              onChange={(p) => patchSlot(s.setNumber, p)}
              onToggle={() => toggle(s)}
            />
          ))}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => addSets(4)}>
              <Plus className="h-4 w-4" /> 4 подхода
            </Button>
            <Button variant="outline" size="sm" onClick={() => addSets(1)}>
              <Plus className="h-4 w-4" /> Подход
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={completeAll}
              disabled={busy || doneCount === slots.length}
            >
              <CheckCheck className="h-4 w-4" /> Отметить все
            </Button>
            <div className="ml-auto">
              <RestTimer rest={item.rest} storageKey={item.id} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Замена упражнения на равноценное (только пока нет записанных подходов). */
function ReplaceExercise({
  workoutId,
  weId,
  currentName,
  onReplaced,
}: {
  workoutId: string;
  weId: string;
  currentName: string;
  onReplaced: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [alts, setAlts] = useState<Exercise[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setOpen(true);
    const r = await api.get<{ alternatives: Exercise[] }>(
      `/workouts/${workoutId}/exercises/${weId}/alternatives`,
    );
    setAlts(r.alternatives);
  }

  async function replace(alternativeId: string) {
    setBusy(true);
    try {
      await api.patch(`/workouts/${workoutId}/exercises/${weId}/replace`, { alternativeId });
      setOpen(false);
      onReplaced();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={load}
        aria-label={`Заменить упражнение «${currentName}»`}
        title="Заменить упражнение"
      >
        <Repeat className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заменить «{currentName}»</DialogTitle>
          </DialogHeader>
          {alts === null ? (
            <p className="text-sm text-muted-foreground">Загружаем…</p>
          ) : alts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Тренер не указал равноценных замен для этого упражнения.
            </p>
          ) : (
            <div className="space-y-2">
              {alts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => replace(a.id)}
                  disabled={busy}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <span className="font-medium">{a.name}</span>
                  {a.muscles && (
                    <span className="text-xs text-muted-foreground">{a.muscles}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SlotRow({
  slot,
  readOnly,
  busy,
  onChange,
  onToggle,
}: {
  slot: Slot;
  readOnly: boolean;
  busy: boolean;
  onChange: (p: Partial<Slot>) => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border p-2 transition-colors ${
        slot.done ? "border-success/40 bg-success/5" : "border-border"
      }`}
    >
      <span className="w-16 shrink-0 text-xs text-muted-foreground">
        Подход {slot.setNumber}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        value={slot.weight}
        onChange={(e) => onChange({ weight: e.target.value })}
        placeholder="кг"
        disabled={readOnly}
        aria-label={`Вес, подход ${slot.setNumber}`}
        className="h-9 w-20"
      />
      <span className="text-muted-foreground">×</span>
      <Input
        type="number"
        inputMode="numeric"
        value={slot.reps}
        onChange={(e) => onChange({ reps: e.target.value })}
        placeholder="повт."
        disabled={readOnly}
        aria-label={`Повторы, подход ${slot.setNumber}`}
        className="h-9 w-20"
      />
      <Select
        value={slot.feeling}
        onValueChange={(v) => onChange({ feeling: v as Feeling })}
        disabled={readOnly}
      >
        <SelectTrigger className="h-9 w-32" aria-label={`Ощущения, подход ${slot.setNumber}`}>
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
      {!readOnly && (
        <Button
          size="icon"
          variant={slot.done ? "default" : "outline"}
          onClick={onToggle}
          disabled={busy}
          aria-label={slot.done ? `Снять отметку подхода ${slot.setNumber}` : `Отметить подход ${slot.setNumber} выполненным`}
          aria-pressed={slot.done}
          className="ml-auto"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/** Завершение тренировки: предупреждение о незаполненных + самочувствие и комментарий. */
function FinishDialog({
  open,
  onOpenChange,
  workoutId,
  missing,
  tonnage,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workoutId: string;
  missing: number;
  tonnage: number;
  onDone: () => void;
}) {
  const [feeling, setFeeling] = useState<Feeling>("moderate");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const tonnageLabel = useMemo(() => Math.round(tonnage).toLocaleString("ru-RU"), [tonnage]);

  async function finish() {
    setBusy(true);
    try {
      await api.patch(`/workouts/${workoutId}/status`, {
        status: "completed",
        feeling,
        comment: comment || undefined,
      });
      onOpenChange(false);
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Завершить тренировку</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {missing > 0 && (
            <div className="rounded-panel border border-warning/30 bg-warning/10 p-3 text-sm">
              Не отмечено подходов: <b>{missing}</b>. Они будут считаться невыполненными.
              Можно закрыть окно и заполнить их.
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Тоннаж тренировки: <b className="text-foreground tabular-nums">{tonnageLabel} кг</b>
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Как прошла тренировка?</label>
            <Select value={feeling} onValueChange={(v) => setFeeling(v as Feeling)}>
              <SelectTrigger aria-label="Самочувствие после тренировки">
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
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="wcomment">
              Комментарий тренеру (необязательно)
            </label>
            <Input
              id="wcomment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Например: болело колено на приседе"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Отмена
            </Button>
            <Button onClick={finish} disabled={busy}>
              {busy ? "Сохраняем…" : "Завершить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
