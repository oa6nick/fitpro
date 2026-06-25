import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader, Spinner, useAsync } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Client, ClientProfile } from "@/lib/domain";

const FIELDS: { key: keyof ClientProfile; label: string }[] = [
  { key: "trainingExperience", label: "Опыт тренировок" },
  { key: "injuries", label: "Травмы / ограничения" },
  { key: "lifestyle", label: "Образ жизни (работа, сон, стресс)" },
  { key: "nutrition", label: "Питание" },
  { key: "equipment", label: "Доступное оборудование" },
  { key: "preferences", label: "Что нравится в тренировках" },
  { key: "dislikes", label: "Что не нравится" },
];

export function ClientProfilePage() {
  const { data, loading, error } = useAsync<{ client: Client; profile: ClientProfile | null }>(
    () => api.get("/me/client"),
  );

  if (loading) return <Spinner />;
  if (error || !data) return <p className="text-sm text-destructive">{error ?? "Ошибка"}</p>;

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

  async function save() {
    setBusy(true);
    setSaved(false);
    const payload: Record<string, unknown> = {};
    for (const { key } of FIELDS) if (form[key]) payload[key] = form[key];
    if (form.steps) payload.steps = Number(form.steps);
    await api.put("/me/profile", payload);
    setBusy(false);
    setSaved(true);
  }

  return (
    <div>
      <PageHeader
        title="Анкета"
        description="Расскажите о себе — тренер составит программу под ваши цели и ограничения."
      />
      <Card>
        <CardContent className="space-y-3 pt-6">
          {FIELDS.map(({ key, label }) => (
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
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={busy}>
              {busy ? "Сохраняем…" : "Сохранить анкету"}
            </Button>
            {saved && <span className="text-sm text-emerald-600">Сохранено ✓</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
