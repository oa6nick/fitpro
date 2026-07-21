import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/AuthShell";

/** Саморегистрация — только для тренеров. Клиенты подключаются по приглашению (/join/:token). */
export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "trainer" ? "/t" : "/c"} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name, email, password });
      navigate("/t");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Card className="glass-elevated w-full rounded-hero border-border/50 shadow-panel">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl tracking-tight">Кабинет тренера</CardTitle>
          <CardDescription className="text-balance leading-relaxed">
            {plan
              ? "14 дней полного доступа. Тариф подключите после пробного периода — карта не нужна."
              : "CRM, программы, дневники клиентов и аналитика — в одном месте. 14 дней бесплатно."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="mb-5 space-y-1.5 rounded-panel border border-border/60 bg-muted/30 px-3.5 py-3 text-xs text-muted-foreground">
            {[
              "До 10 клиентов на пробном периоде",
              "Клиенты входят по вашей ссылке",
              "Карта для старта не нужна",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                {t}
              </li>
            ))}
          </ul>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Как к вам обращаться</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя или бренд"
                required
              />
            </div>
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
            <div className="space-y-1.5">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
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
              {busy ? "Создаём кабинет…" : "Начать бесплатно"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
