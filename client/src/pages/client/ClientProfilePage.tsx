import { useState } from "react";
import { Check, UserCircle } from "lucide-react";
import { api } from "@/lib/api";
import {
  PageHeader,
  Spinner,
  useAsync,
  ErrorBanner,
  FormError,
  Callout,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client, ClientProfile } from "@/lib/domain";

const FIELDS: { key: keyof ClientProfile; label: string; hint?: string }[] = [
  {
    key: "trainingExperience",
    label: "Опыт тренировок",
    hint: "Сколько лет/месяцев, какие виды нагрузки",
  },
  {
    key: "injuries",
    label: "Травмы и ограничения",
    hint: "Всё, что тренеру важно учесть при составлении программы",
  },
  {
    key: "lifestyle",
    label: "Образ жизни",
    hint: "Работа, сон, стресс, сколько времени на тренировки",
  },
  { key: "nutrition", label: "Питание", hint: "Режим, предпочтения, ограничения" },
  {
    key: "equipment",
    label: "Доступное оборудование",
    hint: "Зал, дом, гантели, турник…",
  },
  {
    key: "preferences",
    label: "Что нравится в тренировках",
    hint: "Любимые упражнения и форматы",
  },
  {
    key: "dislikes",
    label: "Что не нравится",
    hint: "Что лучше избегать",
  },
];

export function ClientProfilePage() {
  const { data, loading, error, reload } = useAsync<{
    client: Client;
    profile: ClientProfile | null;
  }>(() => api.get("/me/client"));

  if (loading) return <Spinner />;
  if (error || !data) {
    return <ErrorBanner message={error ?? "Ошибка загрузки"} onRetry={reload} />;
  }

  return <ProfileForm profile={data.profile} />;
}

function ProfileForm({ profile }: { profile: ClientProfile | null }) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    for (const { key } of FIELDS) f[key] = (profile?.[key] as string) ?? "";
    f.steps = profile?.steps != null ? String(profile.steps) : "";
    return f;
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isNew = !profile;

  async function save() {
    setBusy(true);
    setSaved(false);
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const { key } of FIELDS) if (form[key]) payload[key] = form[key];
      if (form.steps) payload.steps = Number(form.steps);
      await api.put("/me/profile", payload);
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="О себе"
        title="Анкета"
        description="Чем подробнее заполните — тем точнее тренер составит программу под ваши цели и ограничения."
      />

      {isNew && (
        <Callout tone="info" icon={UserCircle} title="Первый шаг — рассказать о себе">
          Анкета видна только вашему тренеру. Можно заполнять постепенно и сохранять.
        </Callout>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="icon-well h-9 w-9">
              <UserCircle className="h-4 w-4" />
            </span>
            Ваши данные
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
              <Textarea
                id={key}
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="min-h-[72px]"
                placeholder="Напишите своими словами…"
              />
            </div>
          ))}
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="steps">Шагов в день (примерно)</Label>
            <Input
              id="steps"
              type="number"
              value={form.steps ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
              placeholder="например, 8000"
            />
          </div>

          {saveError && <FormError message={saveError} />}
          {saved && (
            <Callout tone="success" title="Анкета сохранена">
              Тренер увидит обновления в вашей карточке.
            </Callout>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button onClick={save} disabled={busy} className="w-full sm:w-auto sm:min-w-[10rem]">
              {busy ? "Сохраняем…" : saved ? (
                <>
                  <Check className="h-4 w-4" /> Сохранено
                </>
              ) : (
                "Сохранить анкету"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
