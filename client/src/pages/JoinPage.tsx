import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthCard, AuthShell } from "@/components/AuthShell";
import { FormError } from "@/components/common";

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
      <AuthCard>
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="type-page-title">
            {invite ? `Привет, ${invite.clientName}!` : "Приглашение в FitPro"}
          </CardTitle>
          <CardDescription className="text-balance leading-relaxed">
            {notFound ? (
              "Приглашение не найдено или устарело"
            ) : invite ? (
              `Тренер ${invite.trainerName} приглашает вас в личный кабинет: тренировки, дневник и прогресс.`
            ) : (
              <Skeleton className="mx-auto h-4 w-3/4" />
            )}
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
              <div>
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
              <div>
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
              {error && <FormError message={error} />}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Создаём кабинет…" : "Открыть мой кабинет"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                После входа вы увидите программу, дневник и материалы от тренера
              </p>
            </form>
          ) : (
            // Пока грузим инвайт — держим ту же высоту, что и форма
            <div className="space-y-4" aria-hidden>
              <Skeleton className="h-11 w-full rounded-control" />
              <Skeleton className="h-11 w-full rounded-control" />
              <Skeleton className="h-11 w-full rounded-control" />
            </div>
          )}
          {!notFound && (
            <p className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Войти
              </Link>
            </p>
          )}
        </CardContent>
      </AuthCard>
    </AuthShell>
  );
}
