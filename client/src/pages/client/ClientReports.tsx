import { useState } from "react";
import { ClipboardList, Send, History } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  EmptyState,
  ErrorBanner,
  FormError,
  SectionTitle,
  Callout,
} from "@/components/common";
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loading = form.loading || history.loading;

  async function submit() {
    if (!form.data?.form) return;
    setBusy(true);
    setSubmitError(null);
    try {
      await api.post("/reports/submit", {
        formId: form.data.form.id,
        weekStart: currentWeekStart(),
        answers: Object.entries(answers)
          .filter(([, v]) => v)
          .map(([fieldId, value]) => ({ fieldId, value })),
      });
      setDone(true);
      setAnswers({});
      history.reload();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Обратная связь"
        title="Отчёты"
        description="Короткая форма раз в неделю — тренер видит, как прошла неделя, без длинных переписок."
      />
      {/* Один спиннер на экран: два полноразмерных скелетона читаются как поломка. */}
      {loading && <Spinner />}
      {!loading && (
        <>
          {form.error ? (
            <ErrorBanner message={form.error} onRetry={form.reload} />
          ) : !form.data?.form ? (
            <EmptyState
              icon={ClipboardList}
              text="Форма отчёта ещё не настроена"
              hint="Тренер создаст еженедельную форму — после этого вы сможете отправлять отчёты прямо отсюда."
            />
          ) : (
            <Card className="border-primary/20 bg-primary/[0.04]">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="icon-well h-10 w-10">
                    <Send className="h-4 w-4" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{form.data.form.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Неделя с {currentWeekStart()} · заполните честно, это помогает корректировать
                      план
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.data.fields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={`field-${f.id}`}>{f.label}</Label>
                    {f.type === "text" ? (
                      <Textarea
                        id={`field-${f.id}`}
                        value={answers[f.id] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                        placeholder="Ваш ответ…"
                        className="min-h-[88px]"
                      />
                    ) : (
                      <Input
                        id={`field-${f.id}`}
                        type={f.type === "number" ? "number" : "text"}
                        value={answers[f.id] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                        placeholder={f.type === "number" ? "0" : "Ваш ответ…"}
                      />
                    )}
                  </div>
                ))}
                {submitError && <FormError message={submitError} />}
                {done && (
                  <Callout tone="success" title="Отчёт отправлен">
                    Тренер получит уведомление и проверит его.
                  </Callout>
                )}
                <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
                  <Send className="h-4 w-4" />
                  {busy ? "Отправляем…" : "Отправить отчёт"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div>
            <SectionTitle
              title="История отчётов"
              description="Статусы: ожидает проверки, проверен, пропущен"
            />
            {history.error ? (
              <ErrorBanner message={history.error} onRetry={history.reload} />
            ) : history.data && history.data.submissions.length > 0 ? (
              <div className="space-y-2">
                {history.data.submissions.map((s) => (
                  <Card key={s.id} className="surface-interactive">
                    <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
                      <div className="flex items-center gap-3">
                        <span className="icon-well h-9 w-9">
                          <History className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium">Неделя с {s.weekStart}</p>
                          <p className="text-xs text-muted-foreground">Еженедельный отчёт</p>
                        </div>
                      </div>
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
              <EmptyState
                icon={History}
                text="Вы ещё не отправляли отчёты"
                hint="После первой отправки здесь появится история со статусами проверки."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
