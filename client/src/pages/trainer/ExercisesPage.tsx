import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Dumbbell, X } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Exercise } from "@/lib/domain";

const FIELDS: { key: keyof Exercise; label: string; area?: boolean }[] = [
  { key: "name", label: "Название" },
  { key: "videoUrl", label: "Ссылка на видео" },
  { key: "muscles", label: "Задействованные мышцы" },
  { key: "techniqueDescription", label: "Описание техники", area: true },
  { key: "keyHints", label: "Ключевые подсказки", area: true },
  { key: "commonMistakes", label: "Типичные ошибки", area: true },
  { key: "easierVariant", label: "Вариант упрощения" },
  { key: "harderVariant", label: "Вариант усложнения" },
];

export function ExercisesPage() {
  const { data, loading, error, reload } = useAsync<{ exercises: Exercise[] }>(() =>
    api.get("/exercises"),
  );
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Библиотека"
        title="Упражнения"
        description="База упражнений тренера с техникой, ошибками и вариантами."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Упражнение
          </Button>
        }
      />
      {loading && <Spinner />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {data &&
        (data.exercises.length === 0 ? (
          <EmptyState text="Упражнений пока нет — добавьте первое." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.exercises.map((ex) => (
              <Card key={ex.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{ex.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(ex)}
                        aria-label={`Редактировать: ${ex.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await api.delete(`/exercises/${ex.id}`);
                          reload();
                        }}
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {ex.muscles && (
                    <p className="mt-1 text-xs text-muted-foreground">{ex.muscles}</p>
                  )}
                  {ex.techniqueDescription && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {ex.techniqueDescription}
                    </p>
                  )}
                  <Alternatives exercise={ex} all={data.exercises} />
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {(creating || editing) && (
        <ExerciseDialog
          exercise={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ExerciseDialog({
  exercise,
  onClose,
  onSaved,
}: {
  exercise: Exercise | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    for (const { key } of FIELDS) f[key] = (exercise?.[key] as string) ?? "";
    return f;
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const payload: Record<string, string> = {};
    for (const { key } of FIELDS) if (form[key]) payload[key] = form[key];
    if (exercise) await api.patch(`/exercises/${exercise.id}`, payload);
    else await api.post("/exercises", payload);
    setBusy(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exercise ? "Редактировать упражнение" : "Новое упражнение"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {FIELDS.map(({ key, label, area }) => (
            <div key={key}>
              <Label>{label}</Label>
              {area ? (
                <Textarea
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              ) : (
                <Input
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <Button className="w-full" onClick={save} disabled={busy || !form.name}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Равноценные замены упражнения: клиент сможет подменить его в дневнике. */
function Alternatives({ exercise, all }: { exercise: Exercise; all: Exercise[] }) {
  const [alts, setAlts] = useState<Exercise[] | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const r = await api.get<{ alternatives: Exercise[] }>(`/exercises/${exercise.id}/alternatives`);
    setAlts(r.alternatives);
  }, [exercise.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(alternativeId: string) {
    if (!alternativeId) return;
    setAdding(true);
    try {
      await api.post(`/exercises/${exercise.id}/alternatives`, { alternativeId });
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function remove(altId: string) {
    await api.delete(`/exercises/${exercise.id}/alternatives/${altId}`);
    await load();
  }

  const candidates = all.filter(
    (e) => e.id !== exercise.id && !alts?.some((a) => a.id === e.id),
  );

  return (
    <div className="mt-3 border-t pt-3">
      <p className="type-caption mb-2">Равноценные замены</p>
      {alts && alts.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {alts.map((a) => (
            <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
              {a.name}
              <button
                onClick={() => remove(a.id)}
                aria-label={`Убрать замену ${a.name}`}
                className="rounded-full p-0.5 hover:bg-background/60"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {candidates.length > 0 ? (
        <Select value="" onValueChange={add} disabled={adding}>
          <SelectTrigger className="h-9" aria-label={`Добавить замену для ${exercise.name}`}>
            <SelectValue placeholder="Добавить замену" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        !alts?.length && (
          <p className="text-xs text-muted-foreground">Добавьте ещё упражнения в библиотеку.</p>
        )
      )}
    </div>
  );
}
