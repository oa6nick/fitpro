import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader, Spinner, StatCard, useAsync, EmptyState } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function AnalyticsPage() {
  const { data: clientsData } = useAsync<{ clients: Client[] }>(() => api.get("/clients"), []);
  const [clientId, setClientId] = useState<string>("");

  return (
    <div>
      <PageHeader
        eyebrow="Аналитика"
        title="Прогресс клиента"
        description="Прогрессия весов, посещаемость, субъективная тяжесть и замеры по клиенту."
        action={
          <div className="w-56">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger aria-label="Выбор клиента">
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {(clientsData?.clients ?? []).map((c) => (
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
        <EmptyState text="Выберите клиента, чтобы увидеть аналитику." />
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
  if (error || !data) return <p className="text-sm text-destructive">{error}</p>;

  const seriesColors = [colors.primary, colors.info, colors.warning, colors.destructive];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Всего тренировок" value={data.attendance.total} />
        <StatCard label="Выполнено" value={data.attendance.completed} tone="success" />
        <StatCard label="Пропущено" value={data.attendance.skipped} tone="warning" />
        <StatCard
          label="Выполнение плана"
          value={`${data.attendance.completionRate}%`}
          tone={data.attendance.completionRate >= 70 ? "success" : "warning"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Прогрессия рабочих весов</CardTitle>
        </CardHeader>
        <CardContent>
          {data.weightProgression.length === 0 ? (
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
                    tick={{ fill: colors.mutedFg }}
                    {...CHART_AXIS}
                  />
                  <YAxis tick={{ fill: colors.mutedFg }} {...CHART_AXIS} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  {data.weightProgression.map((s, i) => (
                    <Line
                      key={s.exercise}
                      data={s.points}
                      dataKey="weight"
                      name={s.exercise}
                      stroke={seriesColors[i % seriesColors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Субъективная тяжесть (1–4)">
          {data.heaviness.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных.</p>
          ) : (
            <SimpleChart data={data.heaviness} dataKey="avg" color={colors.info} domain={[0, 4]} />
          )}
        </ChartCard>
        <ChartCard title="Вес тела (замеры)">
          {data.measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет замеров.</p>
          ) : (
            <SimpleChart data={data.measurements} dataKey="weight" color={colors.primary} />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
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
  data: any[];
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
          <XAxis dataKey="date" tick={{ fill: colors.mutedFg }} {...CHART_AXIS} />
          <YAxis tick={{ fill: colors.mutedFg }} domain={domain ?? ["auto", "auto"]} {...CHART_AXIS} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
