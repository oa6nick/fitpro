import { useState } from "react";
import { MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Мягкое подтверждение почты: баннер в кабинете, вход не блокируется. */
export function EmailVerifyBanner() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerified !== false) return null;

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/verify/request");
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить код");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/auth/verify/confirm", { code });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный код");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mb-4 rounded-panel border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm"
      role="status"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <MailCheck className="h-4 w-4 shrink-0 text-warning" />
        {step === "idle" ? (
          <>
            <span className="min-w-0 flex-1 truncate text-foreground">
              Подтвердите почту <b className="font-medium">{user.email}</b>
            </span>
            <Button size="sm" variant="outline" onClick={requestCode} disabled={busy}>
              {busy ? "Отправляем…" : "Отправить код"}
            </Button>
          </>
        ) : (
          <form onSubmit={confirmCode} className="flex flex-wrap items-center gap-2">
            <span className="text-foreground">Код из письма:</span>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
              className="h-8 w-28"
              required
            />
            <Button size="sm" type="submit" disabled={busy || code.length < 6}>
              Подтвердить
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={requestCode} disabled={busy}>
              Отправить ещё раз
            </Button>
          </form>
        )}
        {error && <span className="text-destructive">{error}</span>}
      </div>
    </div>
  );
}
