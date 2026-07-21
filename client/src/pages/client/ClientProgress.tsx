import { useState } from "react";
import { Plus, Ruler, TrendingUp, TrendingDown, Flame, Dumbbell } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  EmptyState,
  TableScroll,
  ErrorBanner,
  StatCard,
  SectionTitle,
} from "@/components/common";
import { ChartTooltip } from "@/components/ChartTooltip";
import { useChartColors, CHART_AXIS } from "@/lib/chartTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Measurement } from "@/lib/domain";

interface Analytics {
  attendance: { total: number; completed: number; skipped: number; completionRate: number };
  weightProgression: { exercise: string; points: { date: string; weight: number }[] }[];
  tonnageByWeek: { week: string; kg: number }[];
  topLifts: { exercise: string; e1rm: number; weight: number; reps: number; date: string }[];
  prDeltas: { exercise: string; from: number; to: number; delta: number; sessions: number }[];
  summary: {
    totalTonnage: number;
    volumeTrendPct: number | null;
    loggedSets: number;
    streakWeeks: number;
  };
  measurements: { date: string; weight: number | null; waist: number | null }[];
}

export function ClientProgress() {
  const measurements = useAsync<{ measurements: Measurement[] }>(() => api.get("/measurements"));
  const analytics = useAsync<Analytics>(() => api.get("/analytics/mine"));

  return (
    <div>
      <PageHeader
        eyebrow="Динамика"
        title="Мой прогресс"
        description="Силовые показатели, тоннаж и замеры — видно, что работает, даже когда зеркало врёт."
        action={<AddMeasurement onAdded={() => { measurements.reload(); analytics.reload(); }} />}
      />

      {(measurements.loading || analytics.loading) && <Spinner />}
      {measurements.error && (
        <ErrorBanner message={measurements.error} onRetry={measurements.reload} />
      )}
      {analytics.error && !measurements.error && (
        <ErrorBanner message={analytics.error} onRetry={analytics.reload} />
      )}

      {analytics.data && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="недель серии"
            value={analytics.data.summary.streakWeeks}
            icon={Flame}
            tone="warning"
          />
          <StatCard
            label="тренировок"
            value={analytics.data.attendance.completed}
            icon={Dumbbell}
            tone="success"
            hint={`${analytics.data.attendance.completionRate}% плана`}
          />
          <StatCard
            label="тоннаж"
            value={
              analytics.data.summary.totalTonnage
                ? `${(analytics.data.summary.totalTonnage / 1000).toFixed(1)} т`
                : "—"
            }
            tone="info"
          />
          <StatCard
            label="объём 4 нед."
            value={
              analytics.data.summary.volumeTrendPct == null ? (
                "—"
              ) : (
                <span className="inline-flex items-center gap-1">
                  {analytics.data.summary.volumeTrendPct >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  {analytics.data.summary.volumeTrendPct > 0 ? "+" : ""}
                  {analytics.data.summary.volumeTrendPct}%
                </span>
              )
            }
            tone={
              analytics.data.summary.volumeTrendPct == null
                ? "default"
                : analytics.data.summary.volumeTrendPct >= 0
                  ? "success"
                  : "warning"
            }
          />
        </div>
      )}

      <Tabs defaultValue="training">
        <TabsList>
          <TabsTrigger value="training">Тренировки</TabsTrigger>
          <TabsTrigger value="body">Тело и замеры</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          {!analytics.data || analytics.data.summary.loggedSets === 0 ? (
            <EmptyState
              icon={Dumbbell}
              text="Пока нет данных дневника"
              hint="Отмечайте подходы на тренировках — здесь появятся тоннаж, оценка 1ПМ и рост весов."
            />
          ) : (
            <>
              {(analytics.data.prDeltas?.length ?? 0) > 0 && (
                <div>
                  <SectionTitle title="Рост рабочих весов" description="Первый зафиксированный макс → последний" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {analytics.data.prDeltas.map((p) => (
                      <Card key={p.exercise}>
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{p.exercise}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.from} → {p.to} кг
                            </p>
                          </div>
                          <Badge variant={p.delta >= 0 ? "success" : "destructive"} className="tabular-nums">
                            {p.delta > 0 ? "+" : ""}
                            {p.delta} кг
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base">Тоннаж по неделям</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-56 w-full">
                      <TonnageChart data={analytics.data.tonnageByWeek} />
                    </div>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Оценка 1ПМ</CardTitle>
                    <p className="text-xs text-muted-foreground">По лучшему подходу (формула Epley)</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analytics.data.topLifts.slice(0, 6).map((l) => (
                      <div
                        key={l.exercise}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{l.exercise}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {l.weight}×{l.reps}
                          </p>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-primary">~{l.e1rm}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="body" className="space-y-4">
          {measurements.data &&
            (measurements.data.measurements.length === 0 ? (
              <EmptyState
                icon={Ruler}
                text="Замеров пока нет"
                hint="Добавьте вес и обхваты — через 2–3 недели динамика станет наглядной."
                action={
                  <AddMeasurement
                    onAdded={() => {
                      measurements.reload();
                      analytics.reload();
                    }}
                  />
                }
              />
            ) : (
              <>
                <PhotoTimeline measurements={measurements.data.measurements} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Вес и талия</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 w-full">
                      <BodyChart measurements={measurements.data.measurements} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-0">
                    <TableScroll>
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="p-3 font-medium">Дата</th>
                            <th className="p-3 font-medium">Вес</th>
                            <th className="p-3 font-medium">Талия</th>
                            <th className="p-3 font-medium">Бёдра</th>
                            <th className="p-3 font-medium">Грудь</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurements.data.measurements.map((m) => (
                            <tr key={m.id} className="border-b last:border-0">
                              <td className="p-3">{m.date}</td>
                              <td className="p-3 tabular-nums">{m.weight ?? "—"}</td>
                              <td className="p-3 tabular-nums">{m.waist ?? "—"}</td>
                              <td className="p-3 tabular-nums">{m.hips ?? "—"}</td>
                              <td className="p-3 tabular-nums">{m.chest ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableScroll>
                  </CardContent>
                </Card>
              </>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TonnageChart({ data }: { data: { week: string; kg: number }[] }) {
  const colors = useChartColors();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: colors.mutedFg, fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)}
          {...CHART_AXIS}
        />
        <YAxis tick={{ fill: colors.mutedFg, fontSize: 11 }} {...CHART_AXIS} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="kg" name="кг" fill={colors.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BodyChart({ measurements }: { measurements: Measurement[] }) {
  const colors = useChartColors();
  const data = [...measurements]
    .reverse()
    .map((m) => ({ date: m.date, Вес: m.weight, Талия: m.waist }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: colors.mutedFg, fontSize: 11 }} {...CHART_AXIS} />
        <YAxis tick={{ fill: colors.mutedFg, fontSize: 11 }} {...CHART_AXIS} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="Вес" stroke={colors.primary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Талия" stroke={colors.warning} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PhotoTimeline({ measurements }: { measurements: Measurement[] }) {
  const withPhotos = measurements.filter((m) => m.photoBeforeUrl || m.photoAfterUrl);
  if (withPhotos.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Фото «до / после»</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {withPhotos.map((m) => (
            <div key={m.id} className="shrink-0 text-center">
              <p className="mb-1 text-xs text-muted-foreground">{m.date}</p>
              <div className="flex gap-2">
                {m.photoBeforeUrl && (
                  <img
                    src={m.photoBeforeUrl}
                    alt="до"
                    className="h-40 w-28 rounded-xl border border-border object-cover"
                  />
                )}
                {m.photoAfterUrl && (
                  <img
                    src={m.photoAfterUrl}
                    alt="после"
                    className="h-40 w-28 rounded-xl border border-border object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AddMeasurement({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    date: new Date().toISOString().slice(0, 10),
  });
  const [photoBeforeUrl, setBefore] = useState("");
  const [photoAfterUrl, setAfter] = useState("");
  const [busy, setBusy] = useState(false);

  const fields: [string, string][] = [
    ["weight", "Вес, кг"],
    ["waist", "Талия, см"],
    ["hips", "Бёдра, см"],
    ["chest", "Грудь, см"],
  ];

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>, set: (u: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await api.upload(file);
    set(url);
  }

  async function save() {
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { date: form.date };
      for (const [k] of fields) if (form[k]) payload[k] = Number(form[k]);
      if (photoBeforeUrl) payload.photoBeforeUrl = photoBeforeUrl;
      if (photoAfterUrl) payload.photoAfterUrl = photoAfterUrl;
      await api.post("/measurements", payload);
      setOpen(false);
      setForm({ date: new Date().toISOString().slice(0, 10) });
      setBefore("");
      setAfter("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Замер
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый замер</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Заполните то, что удобно — не обязательно всё сразу.
          </p>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Дата</Label>
            <Input
              type="date"
              value={form.date ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={form[k] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Фото «до»</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadPhoto(e, setBefore)} />
              {photoBeforeUrl && (
                <p className="text-xs text-success" role="status">
                  Загружено ✓
                </p>
              )}
            </div>
            <div>
              <Label>Фото «после»</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadPhoto(e, setAfter)} />
              {photoAfterUrl && (
                <p className="text-xs text-success" role="status">
                  Загружено ✓
                </p>
              )}
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
