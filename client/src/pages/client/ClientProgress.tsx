import { useState } from "react";
import { Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { ChartTooltip } from "@/components/ChartTooltip";
import { useChartColors, CHART_AXIS } from "@/lib/chartTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Measurement } from "@/lib/domain";

export function ClientProgress() {
  const colors = useChartColors();
  const { data, loading, error, reload } = useAsync<{ measurements: Measurement[] }>(() =>
    api.get("/measurements"),
  );

  return (
    <div>
      <PageHeader
        title="Мой прогресс"
        description="Замеры и динамика. Вносите регулярно — так виден результат."
        action={<AddMeasurement onAdded={reload} />}
      />
      {loading && <Spinner />}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {data &&
        (data.measurements.length === 0 ? (
          <EmptyState text="Замеров пока нет — добавьте первый." />
        ) : (
          <div className="space-y-4">
            <PhotoTimeline measurements={data.measurements} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Динамика веса и талии</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[...data.measurements]
                        .reverse()
                        .map((m) => ({ date: m.date, Вес: m.weight, Талия: m.waist }))}
                    >
                      <CartesianGrid strokeDasharray="3 6" stroke={colors.border} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: colors.mutedFg }} {...CHART_AXIS} />
                      <YAxis tick={{ fill: colors.mutedFg }} {...CHART_AXIS} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="Вес" stroke={colors.primary} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Талия" stroke={colors.warning} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
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
                    {data.measurements.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="p-3">{m.date}</td>
                        <td className="p-3">{m.weight ?? "—"}</td>
                        <td className="p-3">{m.waist ?? "—"}</td>
                        <td className="p-3">{m.hips ?? "—"}</td>
                        <td className="p-3">{m.chest ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        ))}
    </div>
  );
}

function PhotoTimeline({ measurements }: { measurements: Measurement[] }) {
  const withPhotos = measurements.filter((m) => m.photoBeforeUrl || m.photoAfterUrl);
  if (withPhotos.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Фото-трансформация</CardTitle>
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
                    className="h-40 w-28 rounded-lg border object-cover"
                  />
                )}
                {m.photoAfterUrl && (
                  <img
                    src={m.photoAfterUrl}
                    alt="после"
                    className="h-40 w-28 rounded-lg border object-cover"
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
    const payload: Record<string, unknown> = { date: form.date };
    for (const [k] of fields) if (form[k]) payload[k] = Number(form[k]);
    if (photoBeforeUrl) payload.photoBeforeUrl = photoBeforeUrl;
    if (photoAfterUrl) payload.photoAfterUrl = photoAfterUrl;
    await api.post("/measurements", payload);
    setBusy(false);
    setOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10) });
    setBefore("");
    setAfter("");
    onAdded();
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
              {photoBeforeUrl && <p className="text-xs text-success" role="status">Загружено ✓</p>}
            </div>
            <div>
              <Label>Фото «после»</Label>
              <Input type="file" accept="image/*" onChange={(e) => uploadPhoto(e, setAfter)} />
              {photoAfterUrl && <p className="text-xs text-success" role="status">Загружено ✓</p>}
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
