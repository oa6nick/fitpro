import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Приглашение в FitPro</CardTitle>
          <CardDescription>
            {notFound
              ? "Приглашение не найдено или устарело"
              : invite
                ? `Тренер ${invite.trainerName} приглашает вас (${invite.clientName}) в личный кабинет`
                : "Проверяем приглашение…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notFound ? (
            <p className="text-center text-sm text-muted-foreground">
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Создаём кабинет…" : "Создать кабинет"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
