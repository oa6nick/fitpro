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
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#db2777", "#7c3aed"];

export function AnalyticsPage() {
  const { data: clientsData } = useAsync<{ clients: Client[] }>(() => api.get("/clients"), []);
  const [clientId, setClientId] = useState<string>("");

  return (
    <div>
      <PageHeader
        title="Аналитика"
        description="Прогрессия весов, посещаемость, субъективная тяжесть и замеры по клиенту."
        action={
          <div className="w-56">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
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
  const { data, loading, error } = useAsync<Analytics>(
    () => api.get(`/analytics/client/${clientId}`),
    [clientId],
  );
  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Всего тренировок" value={data.attendance.total} />
        <Stat label="Выполнено" value={data.attendance.completed} />
        <Stat label="Пропущено" value={data.attendance.skipped} />
        <Stat label="Выполнение плана" value={`${data.attendance.completionRate}%`} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  {data.weightProgression.map((s, i) => (
                    <Line
                      key={s.exercise}
                      data={s.points}
                      dataKey="weight"
                      name={s.exercise}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
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
            <Chart data={data.heaviness} dataKey="avg" color="#db2777" domain={[0, 4]} />
          )}
        </ChartCard>
        <ChartCard title="Вес тела (замеры)">
          {data.measurements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет замеров.</p>
          ) : (
            <Chart data={data.measurements} dataKey="weight" color="#16a34a" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
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

function Chart({
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
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis fontSize={11} domain={domain ?? ["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
