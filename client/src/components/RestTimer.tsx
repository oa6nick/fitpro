import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Persisted {
  /** Момент окончания (мс epoch); null — таймер на паузе. */
  endsAt: number | null;
  /** Остаток на паузе, сек. */
  remaining: number;
  total: number;
}

/** Разбирает «90 сек», «1:30», «2 мин» → секунды. По умолчанию 90. */
export function parseRest(rest: string | null | undefined): number {
  if (!rest) return 90;
  const clock = rest.match(/(\d+):(\d{1,2})/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const num = Number(rest.match(/\d+/)?.[0] ?? 90);
  return /мин|min/i.test(rest) ? num * 60 : num;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function load(key: string): Persisted | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

/**
 * Таймер отдыха между подходами. Состояние в localStorage — переживает
 * переход между упражнениями и перезагрузку страницы.
 * Ключ обязан быть свой на каждое упражнение, иначе таймеры делят состояние.
 */
export function RestTimer({ rest, storageKey }: { rest: string | null; storageKey: string }) {
  const total = parseRest(rest);
  const key = `fitpro-rest-timer:${storageKey}`;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const notified = useRef(false);

  // Восстановление после перезагрузки.
  useEffect(() => {
    const p = load(key);
    if (!p) return;
    if (p.endsAt) {
      const left = Math.round((p.endsAt - Date.now()) / 1000);
      if (left > 0) {
        setRemaining(left);
        setRunning(true);
      }
    } else if (p.remaining > 0 && p.remaining < p.total) {
      setRemaining(p.remaining);
    }
  }, [key]);

  const persist = useCallback(
    (state: Persisted) => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* приватный режим */
      }
    },
    [key],
  );

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          if (!notified.current) {
            notified.current = true;
            navigator.vibrate?.([200, 100, 200]);
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    persist({
      endsAt: running ? Date.now() + remaining * 1000 : null,
      remaining,
      total,
    });
  }, [running, remaining, total, persist]);

  function start() {
    notified.current = false;
    if (remaining === 0) setRemaining(total);
    setRunning(true);
  }

  const done = remaining === 0;
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "relative flex h-9 items-center gap-2 overflow-hidden rounded-full border px-3 text-sm tabular-nums",
          done ? "border-success/40 bg-success/10 text-success" : "border-border bg-card",
        )}
        role="timer"
        aria-live="off"
      >
        <span
          className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        <Timer className="relative h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="relative font-medium">{done ? "Отдых окончен" : fmt(remaining)}</span>
      </div>
      <Button
        size="icon"
        variant={running ? "outline" : "default"}
        onClick={() => (running ? setRunning(false) : start())}
        aria-label={running ? "Пауза таймера отдыха" : "Запустить таймер отдыха"}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setRunning(false);
          setRemaining(total);
          notified.current = false;
        }}
        aria-label="Сбросить таймер"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
