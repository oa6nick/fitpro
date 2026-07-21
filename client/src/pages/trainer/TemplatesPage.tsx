import { useState } from "react";
import { Plus, Trash2, ClipboardList, GripVertical, Link2 } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState, ErrorBanner } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { GROUP_LABELS, type Exercise, type GroupType, type WorkoutTemplate } from "@/lib/domain";

interface Row {
  exerciseId: string;
  sets?: number;
  reps?: string;
  weight?: string;
  rest?: string;
  comment?: string;
  /** Одинаковый ключ = связка (суперсет). Генерится на клиенте: PUT пересоздаёт строки. */
  groupKey?: string;
  groupType?: GroupType;
}

const newGroupKey = () => `g${Math.random().toString(36).slice(2, 10)}`;

/** По числу упражнений в связке: 2 — суперсет, 3 — трисет, 4+ — круговая. */
const groupTypeFor = (n: number): GroupType =>
  n <= 2 ? "superset" : n === 3 ? "triset" : "circuit";

export function TemplatesPage() {
  const { data, loading, error, reload } = useAsync<{ templates: WorkoutTemplate[] }>(() =>
    api.get("/templates"),
  );
  const [building, setBuilding] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Конструктор"
        title="Шаблоны тренировок"
        description="Соберите программу из упражнений и назначьте клиенту в один клик."
        action={
          <Button onClick={() => setBuilding(true)}>
            <Plus className="h-4 w-4" /> Шаблон
          </Button>
        }
      />
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} />}
      {data &&
        (data.templates.length === 0 ? (
          <EmptyState text="Шаблонов пока нет" hint="Соберите первую программу из библиотеки — потом назначайте её клиентам за минуту." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-start justify-between pt-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{t.name}</span>
                    </div>
                    {t.goal && <p className="mt-1 text-xs text-muted-foreground">{t.goal}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await api.delete(`/templates/${t.id}`);
                      reload();
                    }}
                    aria-label="Удалить"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {building && (
        <BuilderDialog
          onClose={() => setBuilding(false)}
          onSaved={() => {
            setBuilding(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

function BuilderDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data } = useAsync<{ exercises: Exercise[] }>(() => api.get("/exercises"), []);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const exMap = new Map((data?.exercises ?? []).map((e) => [e.id, e]));

  function addRow(exerciseId: string) {
    if (!exerciseId) return;
    setRows((r) => [...r, { exerciseId, sets: 3, reps: "10", rest: "90 сек" }]);
  }
  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
    setSelected((s) => s.filter((idx) => idx !== i).map((idx) => (idx > i ? idx - 1 : idx)));
  }

  /** Объединить выделенные строки в связку (общий groupKey). */
  function groupSelected() {
    if (selected.length < 2) return;
    const key = newGroupKey();
    const type = groupTypeFor(selected.length);
    setRows((r) => r.map((row, idx) => (selected.includes(idx) ? { ...row, groupKey: key, groupType: type } : row)));
    setSelected([]);
  }

  function ungroup(key: string) {
    setRows((r) =>
      r.map((row) => (row.groupKey === key ? { ...row, groupKey: undefined, groupType: undefined } : row)),
    );
  }

  async function save() {
    setBusy(true);
    await api.post("/templates", {
      name,
      goal: goal || undefined,
      items: rows.map((r, i) => ({
        exerciseId: r.exerciseId,
        order: i,
        sets: r.sets,
        reps: r.reps,
        weight: r.weight,
        rest: r.rest,
        comment: r.comment,
      })),
    });
    setBusy(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый шаблон программы</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Название</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Цель</Label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Масса / похудение / новичок…"
              />
            </div>
          </div>

          <div>
            <Label>Добавить упражнение</Label>
            <Select value="" onValueChange={addRow}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите из библиотеки" />
              </SelectTrigger>
              <SelectContent>
                {(data?.exercises ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data && data.exercises.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Сначала добавьте упражнения в библиотеку.
              </p>
            )}
          </div>

          {rows.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {selected.length > 0
                  ? `Выбрано: ${selected.length}`
                  : "Отметьте 2–4 упражнения, чтобы объединить в связку"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={groupSelected}
                disabled={selected.length < 2}
              >
                <Link2 className="h-4 w-4" /> Объединить в {GROUP_LABELS[groupTypeFor(Math.max(selected.length, 2))].toLowerCase()}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg border p-2 ${
                  r.groupKey ? "border-primary/40 bg-primary/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(i)}
                  onChange={(e) =>
                    setSelected((s) => (e.target.checked ? [...s, i] : s.filter((x) => x !== i)))
                  }
                  aria-label={`Выбрать упражнение ${i + 1} для связки`}
                  className="h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="w-40 shrink-0 truncate text-sm font-medium">
                  {exMap.get(r.exerciseId)?.name ?? "?"}
                  {r.groupKey && (
                    <button
                      onClick={() => ungroup(r.groupKey!)}
                      className="ml-1.5 text-xs font-normal text-primary hover:underline"
                      title="Разгруппировать"
                    >
                      {GROUP_LABELS[r.groupType ?? "superset"].toLowerCase()}
                    </button>
                  )}
                </span>
                <Input
                  className="w-16"
                  type="number"
                  value={r.sets ?? ""}
                  onChange={(e) => update(i, { sets: Number(e.target.value) })}
                  placeholder="подх."
                />
                <Input
                  className="w-20"
                  value={r.reps ?? ""}
                  onChange={(e) => update(i, { reps: e.target.value })}
                  placeholder="повт."
                />
                <Input
                  className="w-20"
                  value={r.weight ?? ""}
                  onChange={(e) => update(i, { weight: e.target.value })}
                  placeholder="вес"
                />
                <Select
                  value={r.rest ?? "90 сек"}
                  onValueChange={(v) => update(i, { rest: v })}
                >
                  <SelectTrigger className="h-10 w-[7.25rem]" aria-label="Отдых">
                    <SelectValue placeholder="отдых" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { v: "30 сек", l: "30с · изол." },
                      { v: "60 сек", l: "1м · гипертр." },
                      { v: "90 сек", l: "1.5м · база" },
                      { v: "120 сек", l: "2м · сила" },
                      { v: "180 сек", l: "3м · тяж." },
                      { v: "300 сек", l: "5м · 1ПМ" },
                    ].map((o) => (
                      <SelectItem key={o.v} value={o.v}>
                        {o.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Убрать упражнение">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={save} disabled={busy || !name || rows.length === 0}>
            {busy ? "Сохраняем…" : "Сохранить шаблон"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
