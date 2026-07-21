import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/AuthShell";

interface InviteInfo {
  trainerName: string;
  clientName: string;
  email: string | null;
}

/** Регистрация клиента по инвайт-ссылке тренера (/join/:token). */
export function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ invite: InviteInfo }>(`/auth/invite/${token}`)
      .then((r) => {
        setInvite(r.invite);
        if (r.invite.email) setEmail(r.invite.email);
      })
      .catch(() => setNotFound(true));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/auth/invite/${token}/accept`, { email, password });
      await refresh();
      navigate("/c", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать кабинет");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Card className="glass-elevated w-full rounded-hero border-border/50 shadow-panel">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl tracking-tight">
            {invite ? `Привет, ${invite.clientName}!` : "Приглашение в FitPro"}
          </CardTitle>
          <CardDescription className="text-balance leading-relaxed">
            {notFound
              ? "Приглашение не найдено или устарело"
              : invite
                ? `Тренер ${invite.trainerName} приглашает вас в личный кабинет: тренировки, дневник и прогресс.`
                : "Проверяем приглашение…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notFound ? (
            <p className="rounded-panel bg-muted/40 px-4 py-5 text-center text-sm leading-relaxed text-muted-foreground">
              Попросите тренера прислать новую ссылку.{" "}
              <Link to="/" className="font-medium text-primary hover:underline">
                На главную
              </Link>
            </p>
          ) : invite ? (
            <form onSubmit={onSubmit} className="space-y-4">
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
                <Label htmlFor="password">Придумайте пароль</Label>
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
                {busy ? "Создаём кабинет…" : "Открыть мой кабинет"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                После входа вы увидите программу, дневник и материалы от тренера
              </p>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
