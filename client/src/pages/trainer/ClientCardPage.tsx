import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, AlertTriangle, UserPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FUNNEL_ORDER,
  FUNNEL_LABELS,
  type Client,
  type ClientProfile,
  type TrainerNote,
  type Workout,
  type Measurement,
  type WorkoutTemplate,
  type FunnelStatus,
} from "@/lib/domain";

interface CardData {
  client: Client;
  profile: ClientProfile | null;
  notes: TrainerNote[];
  workouts: Workout[];
  measurements: Measurement[];
  payments: unknown[];
}

export function ClientCardPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error, reload } = useAsync<CardData>(
    () => api.get(`/clients/${id}`),
    [id],
  );

  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Не найдено"}</p>;

  const { client } = data;

  return (
    <div>
      <Link
        to="/t/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> К списку клиентов
      </Link>
      <PageHeader
        title={client.name}
        description={client.goal ?? undefined}
        action={
          client.riskFlag && client.funnelStatus === "active" ? (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> Зона риска
            </Badge>
          ) : undefined
        }
      />

      {!client.userId && <InviteBlock clientId={client.id} />}

      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">Основные</TabsTrigger>
          <TabsTrigger value="profile">Анкета</TabsTrigger>
          <TabsTrigger value="notes">Заметки</TabsTrigger>
          <TabsTrigger value="workouts">Тренировки</TabsTrigger>
          <TabsTrigger value="progress">Прогресс</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <MainTab client={client} onChange={reload} />
        </TabsContent>
        <TabsContent value="profile">
          <ProfileTab clientId={client.id} profile={data.profile} onSaved={reload} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab clientId={client.id} notes={data.notes} onChange={reload} />
        </TabsContent>
        <TabsContent value="workouts">
          <WorkoutsTab clientId={client.id} workouts={data.workouts} onChange={reload} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressTab measurements={data.measurements} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Клиент без аккаунта: выдать инвайт-ссылку в кабинет (и опц. отправить письмо). */
function InviteBlock({ clientId }: { clientId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createInvite() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<{ link: string }>(`/clients/${clientId}/invite`, {
        ...(email ? { email } : {}),
      });
      setLink(r.link);
      try {
        await navigator.clipboard.writeText(r.link);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать приглашение");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
        {link ? (
          <>
            <span className="text-muted-foreground">Ссылка-приглашение (7 дней):</span>
            <code className="max-w-full truncate rounded bg-muted px-2 py-1">{link}</code>
            {copied && <Badge variant="secondary">Скопирована</Badge>}
          </>
        ) : (
          <>
            <span className="text-muted-foreground">
              У клиента ещё нет кабинета — пригласите его:
            </span>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="email (необязательно)"
              className="h-8 w-56"
            />
            <Button size="sm" onClick={createInvite} disabled={busy}>
              {busy ? "Создаём…" : email ? "Отправить приглашение" : "Создать ссылку"}
            </Button>
          </>
        )}
        {error && <span className="text-destructive">{error}</span>}
      </div>
    </div>
  );
}

function MainTab({ client, onChange }: { client: Client; onChange: () => void }) {
  const [status, setStatus] = useState<FunnelStatus>(client.funnelStatus);
  const fields: [string, string | number | null][] = [
    ["Возраст", client.age],
    ["Рост, см", client.height],
    ["Вес, кг", client.weight],
    ["Уровень", client.level],
    ["Формат", client.workFormat],
    ["Старт", client.startDate],
    ["Окончание сопровождения", client.supportEndDate],
  ];

  async function changeStatus(v: string) {
    setStatus(v as FunnelStatus);
    await api.patch(`/clients/${client.id}/status`, { status: v });
    onChange();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="max-w-xs">
          <Label>Статус воронки</Label>
          <Select value={status} onValueChange={changeStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUNNEL_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {FUNNEL_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

const PROFILE_FIELDS: { key: keyof ClientProfile; label: string }[] = [
  { key: "trainingExperience", label: "Опыт тренировок" },
  { key: "injuries", label: "Травмы / ограничения" },
  { key: "lifestyle", label: "Образ жизни (работа, сон, стресс)" },
  { key: "nutrition", label: "Питание" },
  { key: "equipment", label: "Доступное оборудование" },
  { key: "preferences", label: "Предпочтения" },
  { key: "dislikes", label: "Антипредпочтения" },
];

function ProfileTab({
  clientId,
  profile,
  onSaved,
}: {
  clientId: string;
  profile: ClientProfile | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    for (const { key } of PROFILE_FIELDS) f[key] = (profile?.[key] as string) ?? "";
    f.steps = profile?.steps != null ? String(profile.steps) : "";
    return f;
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const payload: Record<string, unknown> = { ...form };
    if (form.steps) payload.steps = Number(form.steps);
    else delete payload.steps;
    await api.put(`/clients/${clientId}/profile`, payload);
    setBusy(false);
    onSaved();
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {PROFILE_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <Label>{label}</Label>
            <Textarea
              value={form[key] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="min-h-[60px]"
            />
          </div>
        ))}
        <div className="max-w-xs">
          <Label>Шагов в день</Label>
          <Input
            type="number"
            value={form.steps ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
          />
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? "Сохраняем…" : "Сохранить анкету"}
        </Button>
      </CardContent>
    </Card>
  );
}

function NotesTab({
  clientId,
  notes,
  onChange,
}: {
  clientId: string;
  notes: TrainerNote[];
  onChange: () => void;
}) {
  const [text, setText] = useState("");
  async function add() {
    if (!text.trim()) return;
    await api.post(`/clients/${clientId}/notes`, { text });
    setText("");
    onChange();
  }
  async function remove(noteId: string) {
    await api.delete(`/clients/${clientId}/notes/${noteId}`);
    onChange();
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 pt-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Новая заметка о клиенте…"
          />
          <Button onClick={add} disabled={!text.trim()}>
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </CardContent>
      </Card>
      {notes.length === 0 ? (
        <EmptyState text="Заметок пока нет" />
      ) : (
        notes.map((n) => (
          <Card key={n.id}>
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div>
                <p className="whitespace-pre-wrap text-sm">{n.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(n.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  assigned: "Назначена",
  completed: "Выполнена",
  skipped: "Пропущена",
};

function WorkoutsTab({
  clientId,
  workouts,
  onChange,
}: {
  clientId: string;
  workouts: Workout[];
  onChange: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AssignWorkoutDialog clientId={clientId} onAssigned={onChange} />
      </div>
      {workouts.length === 0 ? (
        <EmptyState text="Тренировки ещё не назначены" />
      ) : (
        workouts.map((w) => (
          <Card key={w.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-medium">{w.title ?? "Тренировка"}</p>
                <p className="text-xs text-muted-foreground">
                  {w.date ?? "без даты"}
                </p>
              </div>
              <Badge
                variant={
                  w.status === "completed"
                    ? "success"
                    : w.status === "skipped"
                      ? "destructive"
                      : "secondary"
                }
              >
                {STATUS_LABEL[w.status]}
              </Badge>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function AssignWorkoutDialog({
  clientId,
  onAssigned,
}: {
  clientId: string;
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useAsync<{ templates: WorkoutTemplate[] }>(
    () => api.get("/templates"),
    [],
  );

  async function assign() {
    setBusy(true);
    await api.post("/workouts", {
      clientId,
      title: title || undefined,
      date: date || undefined,
      templateId: templateId || undefined,
    });
    setBusy(false);
    setOpen(false);
    setTitle("");
    setDate("");
    setTemplateId("");
    onAssigned();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Назначить тренировку
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Назначить тренировку</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: День ног А"
            />
          </div>
          <div>
            <Label>Дата</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Из шаблона программы (упражнения скопируются)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Без шаблона" />
              </SelectTrigger>
              <SelectContent>
                {data?.templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={assign} disabled={busy}>
            {busy ? "Назначаем…" : "Назначить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProgressTab({ measurements }: { measurements: Measurement[] }) {
  const colors = useChartColors();
  if (measurements.length === 0) return <EmptyState text="Замеров пока нет" />;
  const chartData = [...measurements]
    .reverse()
    .map((m) => ({ date: m.date, Вес: m.weight, Талия: m.waist }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Динамика веса и талии</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
              {measurements.map((m) => (
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
  );
}
