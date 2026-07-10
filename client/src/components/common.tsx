import { useEffect, useState, useCallback } from "react";
import { Inbox, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  /** Мелкая капс-надпись над заголовком (например, раздел). */
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="type-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="type-page-title">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function Stub({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={Sparkles}
        text="Раздел скоро появится"
        hint="Этот модуль в плане развития платформы. В текущем MVP сосредоточились на ядре: CRM, программах и кабинете клиента."
      />
    </div>
  );
}

/** Скелетная загрузка (сигнатура прежнего текстового Spinner сохранена). */
export function Spinner({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="space-y-3 py-6" role="status" aria-label={label}>
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-28 w-full rounded-panel" />
      <Skeleton className="h-28 w-2/3 rounded-panel" />
    </div>
  );
}

/** Единый вид пустоты: пунктирное стекло + иконка в пилюле (по умолчанию Inbox). */
export function EmptyState({
  text,
  hint,
  icon: Icon = Inbox,
  action,
}: {
  text: string;
  hint?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center gap-3 rounded-hero border-dashed px-6 py-12 text-center sm:py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground/70">{hint}</p>}
      {action}
    </div>
  );
}

export type StatTone = "default" | "success" | "info" | "warning" | "destructive";

const STAT_TONES: Record<StatTone, string> = {
  default: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  info: "text-info bg-info/10",
  warning: "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
};

/** KPI-карточка (паттерн Pariall StatCard): крупное число + подпись + иконка в пилюле. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-transform duration-200 ease-spring hover:-translate-y-1",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/[0.08]"
        aria-hidden
      />
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold leading-tight tabular-nums sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
              STAT_TONES[tone],
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Узкий экран (< md). Для выбора мобильных раскладок вместо обрезанных таблиц. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

/** Горизонтальный скролл для таблиц — вместо обрезания колонок на узких экранах. */
export function TableScroll({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

/** Простой загрузчик данных с состояниями. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    fn()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e.message ?? "Ошибка"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { data, loading, error, reload: run };
}
