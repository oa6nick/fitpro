import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthCard, AuthShell } from "@/components/AuthShell";
import { FormError } from "@/components/common";

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
      <AuthCard>
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="type-page-title">Регистрация тренера</CardTitle>
          <CardDescription className="text-balance leading-relaxed">
            {plan
              ? "14 дней полного доступа. Карта не нужна — тариф выберете после пробного периода."
              : "Клиенты, программы, дневники и аналитика в одном кабинете. 14 дней бесплатно."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="surface-subtle mb-5 space-y-1.5 rounded-panel px-3.5 py-3 text-sm text-muted-foreground">
            {[
              "До 10 клиентов в пробном периоде",
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
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как к вам обращаться"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="email@example.com"
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
                placeholder="Не меньше 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {error && <FormError message={error} />}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Создаём кабинет…" : "Создать кабинет"}
            </Button>
          </form>
          <p className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
}
