import { useState } from "react";
import { Plus, Trash2, FileText, Check } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState, ErrorBanner } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  type ReportForm,
  type ReportFieldType,
  type ReportSubmission,
  type ReportField,
  type ReportAnswer,
} from "@/lib/domain";

export function ReportsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Обратная связь"
        title="Отчёты"
        description="Своя форма отчёта и проверка заполнений — ничего не теряется в переписке."
      />
      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">Заполнения</TabsTrigger>
          <TabsTrigger value="forms">Формы</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions">
          <Submissions />
        </TabsContent>
        <TabsContent value="forms">
          <Forms />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Submissions() {
  const [status, setStatus] = useState<string>("all");
  const { data, loading, error, reload } = useAsync<{ submissions: ReportSubmission[] }>(
    () => api.get(`/reports/submissions${status === "all" ? "" : `?status=${status}`}`),
    [status],
  );
  const [view, setView] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="w-full sm:w-56">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="awaiting_review">Ожидают проверки</SelectItem>
            <SelectItem value="reviewed">Проверены</SelectItem>
            <SelectItem value="missed">Пропущены</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.submissions.length === 0 ? (
          <EmptyState text="Заполнений пока нет" hint="Когда клиенты отправят отчёты, они появятся здесь со статусами." />
        ) : (
          <div className="space-y-2">
            {data.submissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 sm:p-5">
                  <button className="text-left" onClick={() => setView(s.id)}>
                    <p className="font-medium hover:underline">{s.clientName}</p>
                    <p className="text-xs text-muted-foreground">Неделя с {s.weekStart}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        s.status === "reviewed"
                          ? "success"
                          : s.status === "missed"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {REPORT_STATUS_LABELS[s.status]}
                    </Badge>
                    {s.status === "awaiting_review" && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await api.patch(`/reports/submissions/${s.id}/review`);
                          reload();
                        }}
                      >
                        <Check className="h-4 w-4" /> Проверен
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      {view && <SubmissionDialog id={view} onClose={() => setView(null)} />}
    </div>
  );
}

function SubmissionDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, loading } = useAsync<{
    submission: ReportSubmission;
    fields: ReportField[];
    answers: ReportAnswer[];
  }>(() => api.get(`/reports/submissions/${id}`), [id]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отчёт клиента</DialogTitle>
        </DialogHeader>
        {loading && <Skeleton className="h-24 w-full rounded-panel" />}
        {data && (
          <div className="space-y-3">
            {data.fields.map((f) => {
              const ans = data.answers.find((a) => a.fieldId === f.id);
              return (
                <div key={f.id} className="border-b pb-2">
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium">{ans?.value || "—"}</p>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Forms() {
  const { data, loading, error, reload } = useAsync<{ forms: ReportForm[] }>(() =>
    api.get("/reports/forms"),
  );
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Форма отчёта
        </Button>
      </div>
      {loading && <Spinner />}
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {data &&
        (data.forms.length === 0 ? (
          <EmptyState text="Форм пока нет" hint="Создайте еженедельную форму — клиенты будут заполнять её в своём кабинете." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.forms.map((f) => (
              <Card key={f.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" /> {f.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await api.delete(`/reports/forms/${f.id}`);
                        reload();
                      }}
                      aria-label={`Удалить: ${f.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {f.fields?.map((fld) => (
                      <li key={fld.id}>
                        • {fld.label}{" "}
                        <span className="text-xs">({REPORT_TYPE_LABELS[fld.type]})</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      {creating && (
        <FormDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

interface FieldDraft {
  label: string;
  type: ReportFieldType;
}

function FormDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("Еженедельный отчёт");
  const [fields, setFields] = useState<FieldDraft[]>([
    { label: "Вес", type: "number" },
    { label: "Шаги (среднее)", type: "number" },
    { label: "Сон", type: "text" },
    { label: "Что было сложно", type: "text" },
  ]);
  const [busy, setBusy] = useState(false);

  function addField() {
    setFields((f) => [...f, { label: "", type: "text" }]);
  }
  function update(i: number, patch: Partial<FieldDraft>) {
    setFields((f) => f.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  async function save() {
    setBusy(true);
    await api.post("/reports/forms", {
      name,
      fields: fields.filter((f) => f.label).map((f, i) => ({ ...f, order: i })),
    });
    setBusy(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая форма отчёта</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Label>Поля</Label>
          {fields.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="flex-1"
                value={f.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Название поля"
              />
              <div className="w-32">
                <Select value={f.type} onValueChange={(v) => update(i, { type: v as ReportFieldType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4" /> Поле
          </Button>
          <Button className="w-full" onClick={save} disabled={busy || !name}>
            {busy ? "Сохраняем…" : "Создать форму"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
