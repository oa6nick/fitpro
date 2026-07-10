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
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <MailCheck className="h-4 w-4 shrink-0 text-amber-600" />
        {step === "idle" ? (
          <>
            <span className="text-amber-900">
              Подтвердите почту <b>{user.email}</b> — пришлём код.
            </span>
            <Button size="sm" variant="outline" onClick={requestCode} disabled={busy}>
              {busy ? "Отправляем…" : "Отправить код"}
            </Button>
          </>
        ) : (
          <form onSubmit={confirmCode} className="flex flex-wrap items-center gap-2">
            <span className="text-amber-900">Код из письма:</span>
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
