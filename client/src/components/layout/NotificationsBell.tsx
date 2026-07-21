import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, BellRing } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  currentSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import type { AppNotification } from "@/lib/domain";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  async function load() {
    try {
      const r = await api.get<{ notifications: AppNotification[]; unread: number }>(
        "/notifications",
      );
      setItems(r.notifications);
      setUnread(r.unread);
    } catch {
      /* тихо игнорируем */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function openPanel() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      await api.post("/notifications/read-all");
      setUnread(0);
    }
  }

  async function go(n: AppNotification) {
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        onClick={openPanel}
        className="relative"
        aria-label={unread ? `Уведомления, непрочитанных: ${unread}` : "Уведомления"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-panel border bg-popover shadow-panel">
          <div className="border-b px-3 py-2 text-sm font-semibold">Уведомления</div>
          <PushToggle />
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Пока пусто</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n)}
                  className={cn(
                    "block w-full border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <p>{n.text}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString("ru-RU")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Подписка на push: показываем только когда браузер и сервер это умеют. */
function PushToggle() {
  const [state, setState] = useState<"loading" | "off" | "on" | "unavailable">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!pushSupported()) return alive && setState("unavailable");
      const { enabled } = await api
        .get<{ enabled: boolean }>("/push/vapid-public-key")
        .catch(() => ({ enabled: false }));
      if (!enabled) return alive && setState("unavailable");
      const sub = await currentSubscription();
      if (alive) setState(sub ? "on" : "off");
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state === "loading" || state === "unavailable") return null;

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (state === "on") {
        await unsubscribeFromPush();
        setState("off");
      } else {
        const r = await subscribeToPush();
        setState(r.ok ? "on" : "off");
        if (!r.ok && r.reason) setError(r.reason);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b">
      <button
        onClick={toggle}
        disabled={busy}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {state === "on" ? (
          <>
            <BellRing className="h-3.5 w-3.5 text-primary" />
            Push-уведомления включены — отключить
          </>
        ) : (
          <>
            <BellOff className="h-3.5 w-3.5" />
            Включить push-уведомления
          </>
        )}
      </button>
      {error && (
        <p className="px-3 pb-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
