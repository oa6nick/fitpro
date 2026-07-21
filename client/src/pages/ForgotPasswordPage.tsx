import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/AuthShell";

/** Восстановление пароля: шаг 1 — код на почту, шаг 2 — код + новый пароль. */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/reset/request", { email });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/reset/confirm", { email, code, password });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сменить пароль");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Card className="glass-elevated w-full rounded-hero border-border/50 shadow-panel">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl tracking-tight">Восстановление пароля</CardTitle>
          <CardDescription className="text-balance leading-relaxed">
            {step === 1
              ? "Укажите email аккаунта — если он есть, пришлём код для смены пароля."
              : `Код отправлен на ${email}. Введите его и придумайте новый пароль.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full shadow-glow" disabled={busy}>
                {busy ? "Отправляем…" : "Получить код"}
              </Button>
            </form>
          ) : (
            <form onSubmit={confirmReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Код из письма</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 цифр"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Новый пароль</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full shadow-glow" disabled={busy}>
                {busy ? "Сохраняем…" : "Сменить пароль"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(1)}
                disabled={busy}
              >
                Отправить код ещё раз
              </Button>
            </form>
          )}
          <p className="mt-5 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
            Вспомнили пароль?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
