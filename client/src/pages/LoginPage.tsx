import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/AuthShell";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
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
      const u = await login(email, password);
      navigate(u.role === "trainer" ? "/t" : "/c");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Card className="glass-elevated w-full rounded-hero border-border/50 shadow-panel">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl tracking-tight">Вход в FitPro</CardTitle>
          <CardDescription className="text-balance leading-relaxed">
            Кабинет тренера или клиента — в зависимости от вашего аккаунта.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  to="/forgot"
                  className="text-xs font-medium text-muted-foreground hover:text-primary"
                >
                  Забыли?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
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
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Входим…" : "Войти"}
            </Button>
          </form>
          <div className="mt-6 space-y-2 border-t border-border pt-5 text-center text-sm">
            <p className="text-muted-foreground">
              Тренер без аккаунта?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Попробовать 14 дней
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              Клиенту нужна ссылка-приглашение от тренера
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
