import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPORT_STATUS_LABELS,
  type ReportField,
  type ReportForm,
  type ReportSubmission,
} from "@/lib/domain";

function currentWeekStart(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function ClientReports() {
  const form = useAsync<{ form: ReportForm | null; fields: ReportField[] }>(() =>
    api.get("/reports/my-form"),
  );
  const history = useAsync<{ submissions: ReportSubmission[] }>(() => api.get("/reports/mine"));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!form.data?.form) return;
    setBusy(true);
    await api.post("/reports/submit", {
      formId: form.data.form.id,
      weekStart: currentWeekStart(),
      answers: Object.entries(answers)
        .filter(([, v]) => v)
        .map(([fieldId, value]) => ({ fieldId, value })),
    });
    setBusy(false);
    setDone(true);
    setAnswers({});
    history.reload();
  }

  return (
    <div>
      <PageHeader title="Отчёты" description="Заполните еженедельный отчёт тренеру." />
      {form.loading ? (
        <Spinner />
      ) : !form.data?.form ? (
        <EmptyState text="Тренер ещё не настроил форму отчёта." />
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{form.data.form.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.data.fields.map((f) => (
              <div key={f.id}>
                <Label>{f.label}</Label>
                {f.type === "text" ? (
                  <Textarea
                    value={answers[f.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                  />
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={answers[f.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={busy}>
                {busy ? "Отправляем…" : "Отправить отчёт"}
              </Button>
              {done && <span className="text-sm text-emerald-600">Отправлено ✓</span>}
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">История отчётов</h2>
      {history.loading ? (
        <Spinner />
      ) : history.data && history.data.submissions.length > 0 ? (
        <div className="space-y-2">
          {history.data.submissions.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between py-3">
                <span className="text-sm">Неделя с {s.weekStart}</span>
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState text="Вы ещё не отправляли отчёты." />
      )}
    </div>
  );
}
