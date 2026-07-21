import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Persisted {
  endsAt: number | null;
  remaining: number;
  total: number;
}

/** Типовые паузы в силовом тренинге (сек). */
export const REST_PRESETS = [
  { sec: 30, label: "30с", hint: "изоляция / метабол" },
  { sec: 60, label: "1м", hint: "гипертрофия" },
  { sec: 90, label: "1.5м", hint: "база" },
  { sec: 120, label: "2м", hint: "сила" },
  { sec: 180, label: "3м", hint: "тяжёлые" },
  { sec: 300, label: "5м", hint: "1ПМ / пик" },
] as const;

/** Разбирает «90 сек», «1:30», «2 мин» → секунды. По умолчанию 90. */
export function parseRest(rest: string | null | undefined): number {
  if (!rest) return 90;
  const clock = rest.match(/(\d+):(\d{1,2})/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const num = Number(rest.match(/\d+/)?.[0] ?? 90);
  return /мин|min/i.test(rest) ? num * 60 : num;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function load(key: string): Persisted | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

/**
 * Таймер отдыха между подходами.
 * Пресеты 30с–5м + ±/пауза/сброс. Состояние в localStorage.
 */
export function RestTimer({
  rest,
  storageKey,
  compact,
}: {
  rest: string | null;
  storageKey: string;
  /** Компактный вид без подписей пресетов (в карточке упражнения). */
  compact?: boolean;
}) {
  const planned = parseRest(rest);
  const key = `fitpro-rest-timer:${storageKey}`;
  const [total, setTotal] = useState(planned);
  const [remaining, setRemaining] = useState(planned);
  const [running, setRunning] = useState(false);
  const notified = useRef(false);

  useEffect(() => {
    const p = load(key);
    if (!p) {
      setTotal(planned);
      setRemaining(planned);
      return;
    }
    if (p.endsAt) {
      const left = Math.round((p.endsAt - Date.now()) / 1000);
      if (left > 0) {
        setTotal(p.total || planned);
        setRemaining(left);
        setRunning(true);
        return;
      }
    }
    if (p.remaining > 0 && p.remaining < (p.total || planned)) {
      setTotal(p.total || planned);
      setRemaining(p.remaining);
    } else {
      setTotal(planned);
      setRemaining(planned);
    }
  }, [key, planned]);

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

  function applyPreset(sec: number) {
    setRunning(false);
    setTotal(sec);
    setRemaining(sec);
    notified.current = false;
  }

  function nudge(delta: number) {
    setRunning(false);
    setTotal((t) => Math.max(15, t + delta));
    setRemaining((r) => Math.max(15, (r === 0 ? total : r) + delta));
    notified.current = false;
  }

  const done = remaining === 0;
  const pct = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", compact ? "" : "rounded-xl border border-border/70 bg-muted/30 p-3")}>
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            "relative flex h-10 min-w-[7.5rem] items-center gap-2 overflow-hidden rounded-lg border px-3 text-sm tabular-nums",
            done
              ? "border-success/40 bg-success/10 text-success"
              : running
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-card",
          )}
          role="timer"
          aria-live="off"
        >
          <span
            className="absolute inset-y-0 left-0 bg-primary/15 transition-all"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
          <Timer className="relative h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="relative font-semibold tracking-tight">
            {done ? "Готово" : fmt(remaining)}
          </span>
        </div>

        <Button
          size="icon"
          variant={running ? "outline" : "default"}
          onClick={() => (running ? setRunning(false) : start())}
          aria-label={running ? "Пауза" : "Старт отдыха"}
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
          aria-label="Сбросить"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => nudge(-15)}>
            −15
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => nudge(15)}>
            +15
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Пресеты отдыха">
        {REST_PRESETS.map((p) => (
          <button
            key={p.sec}
            type="button"
            onClick={() => applyPreset(p.sec)}
            title={p.hint}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors",
              total === p.sec && !running
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {!compact && rest && (
        <p className="text-[11px] text-muted-foreground">
          По плану: {rest}
          {planned !== total ? ` · сейчас ${fmt(total)}` : ""}
        </p>
      )}
    </div>
  );
}
