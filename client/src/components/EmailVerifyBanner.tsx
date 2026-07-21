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
      className="mb-5 rounded-panel border border-warning/35 bg-warning/10 px-3.5 py-3 text-sm shadow-sm"
      role="status"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
        {step === "idle" ? (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-2 text-foreground">
              <MailCheck className="h-4 w-4 shrink-0 text-warning" />
              <span className="truncate">
                Подтвердите почту <b className="font-medium">{user.email}</b>
              </span>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={requestCode}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              {busy ? "Отправляем…" : "Отправить код"}
            </Button>
          </>
        ) : (
          <form
            onSubmit={confirmCode}
            className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-label="Код из письма"
              placeholder="Код из письма"
              className="w-full sm:w-32"
              required
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                type="submit"
                disabled={busy || code.length < 6}
                className="flex-1 sm:flex-none"
              >
                Подтвердить
              </Button>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={requestCode}
                disabled={busy}
                className="flex-1 sm:flex-none"
              >
                Отправить ещё раз
              </Button>
            </div>
          </form>
        )}
        {error && (
          <span className="text-destructive" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
