import { useState } from "react";
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
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Dumbbell, Activity } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  StatCard,
  useAsync,
  EmptyState,
  ErrorBanner,
  SectionTitle,
} from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartTooltip } from "@/components/ChartTooltip";
import { useChartColors, CHART_AXIS } from "@/lib/chartTheme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/lib/domain";

interface Analytics {
  attendance: { total: number; completed: number; skipped: number; completionRate: number };
  weightProgression: { exercise: string; points: { date: string; weight: number }[] }[];
  heaviness: { date: string; avg: number }[];
  measurements: { date: string; weight: number | null; waist: number | null }[];
  tonnageByWeek?: { week: string; kg: number }[];
  topLifts?: { exercise: string; e1rm: number; weight: number; reps: number; date: string }[];
  prDeltas?: { exercise: string; from: number; to: number; delta: number; sessions: number }[];
  summary?: { totalTonnage: number; volumeTrendPct: number | null; loggedSets: number };
}

export function AnalyticsPage() {
  const { data: clientsData } = useAsync<{ clients: Client[] }>(() => api.get("/clients"), []);
  const [clientId, setClientId] = useState<string>("");
  const active = (clientsData?.clients ?? []).filter((c) => c.funnelStatus === "active");
  const list = active.length ? active : (clientsData?.clients ?? []);

  return (
    <div>
      <PageHeader
        eyebrow="Аналитика"
        title="Прогресс клиента"
        description="Тоннаж, рабочие веса, оценка 1ПМ и посещаемость — чтобы корректировать план по фактам, а не по ощущениям."
        action={
          <div className="w-56">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger aria-label="Выбор клиента">
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {list.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
      {!clientId ? (
        <EmptyState
          icon={Activity}
          text="Выберите клиента"
          hint="Аналитика строится из дневника тренировок и замеров. Чем регулярнее логи — тем точнее картина."
        />
      ) : (
        <AnalyticsBody clientId={clientId} />
      )}
    </div>
  );
}

function AnalyticsBody({ clientId }: { clientId: string }) {
  const colors = useChartColors();
  const { data, loading, error } = useAsync<Analytics>(
    () => api.get(`/analytics/client/${clientId}`),
    [clientId],
  );
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBanner message={error ?? "Не удалось загрузить аналитику"} />;

  const seriesColors = [colors.primary, colors.info, colors.warning, colors.destructive];
  const trend = data.summary?.volumeTrendPct;
  // Топ-6 упражнений по числу точек (самые «живые» в программе).
  const mainLifts = [...data.weightProgression]
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Тренировок всего" value={data.attendance.total} icon={Dumbbell} />
        <StatCard
          label="Выполнение плана"
          value={`${data.attendance.completionRate}%`}
          tone={data.attendance.completionRate >= 70 ? "success" : "warning"}
          hint={`${data.attendance.completed} из ${data.attendance.total}`}
        />
        <StatCard
          label="Тоннаж суммарно"
          value={
            data.summary?.totalTonnage
              ? `${Math.round(data.summary.totalTonnage / 1000)} т`
              : "—"
          }
          tone="info"
          hint={
            data.summary?.loggedSets
              ? `${data.summary.loggedSets} подходов в дневнике`
              : undefined
          }
        />
        <StatCard
          label="Объём 4 нед."
          value={
            trend == null ? "—" : (
              <span className="inline-flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
            )
          }
          tone={trend == null ? "default" : trend >= 0 ? "success" : "warning"}
          hint="vs предыдущие 4 недели"
        />
      </div>

      {(data.prDeltas?.length ?? 0) > 0 && (
        <div>
          <SectionTitle
            title="Движение рабочих весов"
            description="Сравнение первого и последнего зафиксированного максимума"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.prDeltas!.map((p) => (
              <Card key={p.exercise}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.exercise}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.from} → {p.to} кг · {p.sessions} замер.
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
            <p className="text-xs text-muted-foreground">
              Сумма вес × повторы. Падение 2+ недели подряд — сигнал пересмотреть объём или восстановление.
            </p>
          </CardHeader>
          <CardContent>
            {!data.tonnageByWeek?.length ? (
              <p className="text-sm text-muted-foreground">Нет данных дневника.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tonnageByWeek}>
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
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Оценка 1ПМ (Epley)</CardTitle>
            <p className="text-xs text-muted-foreground">
              По лучшему подходу. Ориентир для % интенсивности, не лабораторный 1ПМ.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data.topLifts?.length ? (
              <p className="text-sm text-muted-foreground">Нужны логи с весом и повторами.</p>
            ) : (
              data.topLifts.map((l) => (
                <div
                  key={l.exercise}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.exercise}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {l.weight}×{l.reps} · {l.date}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                    ~{l.e1rm} кг
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Прогрессия рабочих весов</CardTitle>
          <p className="text-xs text-muted-foreground">
            Макс. вес за день по основным упражнениям (до 6 с наибольшей историей).
          </p>
        </CardHeader>
        <CardContent>
          {mainLifts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных дневника.</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
                  <XAxis
                    dataKey="date"
                    type="category"
                    allowDuplicatedCategory={false}
                    tick={{ fill: colors.mutedFg, fontSize: 11 }}
                    {...CHART_AXIS}
                  />
                  <YAxis tick={{ fill: colors.mutedFg, fontSize: 11 }} {...CHART_AXIS} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  {mainLifts.map((s, i) => (
                    <Line
                      key={s.exercise}
                      data={s.points}
                      dataKey="weight"
                      name={s.exercise}
                      stroke={seriesColors[i % seriesColors.length]}
                      strokeWidth={2}
                      dot={false}
                      type="monotone"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Субъективная тяжесть (1–4)"
          hint="1 легко · 4 очень тяжело. Рост тяжести при падении объёма — возможное недовосстановление."
        >
          {data.heaviness.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет отметок feeling в дневнике.</p>
          ) : (
            <SimpleChart data={data.heaviness} dataKey="avg" color={colors.info} domain={[0, 4]} />
          )}
        </ChartCard>
        <ChartCard title="Вес тела (замеры)" hint="Из раздела прогресса / замеров клиента.">
          {data.measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Замеров пока нет.</p>
          ) : (
            <SimpleChart data={data.measurements} dataKey="weight" color={colors.primary} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SimpleChart({
  data,
  dataKey,
  color,
  domain,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  domain?: [number, number];
}) {
  const colors = useChartColors();
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
          <XAxis dataKey="date" tick={{ fill: colors.mutedFg, fontSize: 11 }} {...CHART_AXIS} />
          <YAxis
            tick={{ fill: colors.mutedFg, fontSize: 11 }}
            domain={domain ?? ["auto", "auto"]}
            {...CHART_AXIS}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
