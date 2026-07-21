import { useEffect, useState, useCallback } from "react";
import {
  AlertCircle,
  Inbox,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Приветствие по времени суток — дружелюбный тон кабинетов. */
export function greetingByTime(name?: string | null): string {
  const h = new Date().getHours();
  const base =
    h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
  const short = name?.trim().split(/\s+/)[0];
  return short ? `${base}, ${short}` : base;
}

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
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="type-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="type-page-title text-balance">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}

/** Подзаголовок секции внутри страницы. */
export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-end justify-between gap-2",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
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
    <div className="space-y-3 py-6" role="status" aria-live="polite" aria-label={label}>
      <Skeleton className="h-9 w-1/3 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-panel" />
        <Skeleton className="h-28 w-full rounded-panel" />
        <Skeleton className="h-28 w-full rounded-panel sm:col-span-2 lg:col-span-1" />
      </div>
      <Skeleton className="h-40 w-full rounded-panel" />
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
    <div className="glass-card flex flex-col items-center gap-3 rounded-panel border-dashed px-6 py-12 text-center sm:py-16">
      <div className="icon-well h-14 w-14">
        <Icon className="h-6 w-6" />
      </div>
      <p className="max-w-sm text-sm font-medium text-foreground/90">{text}</p>
      {hint && (
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** Ошибка загрузки / действия — дружелюбный баннер вместо голого текста. */
export function ErrorBanner({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-panel border border-destructive/25 bg-destructive/8 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-destructive">Не удалось загрузить</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 border-destructive/25 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          Повторить
        </Button>
      )}
    </div>
  );
}

/**
 * Компактная пустота ВНУТРИ карточки/секции — там, где полноразмерный EmptyState
 * выглядел бы тяжелее содержимого (блоки аналитики, колонки канбана, списки на главной).
 */
export function EmptyHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "surface-subtle rounded-xl px-3 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Ошибка внутри формы — единый вид для всех страниц входа и диалогов. */
export function FormError({ message, className }: { message: string; className?: string }) {
  return (
    <p
      role="alert"
      className={cn(
        "rounded-control border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive",
        className,
      )}
    >
      {message}
    </p>
  );
}

export type CalloutTone = "default" | "success" | "info" | "warning" | "destructive";

const CALLOUT_STYLES: Record<CalloutTone, string> = {
  default: "border-border/70 bg-card/90",
  success: "border-success/30 bg-success/8",
  info: "border-info/30 bg-info/8",
  warning: "border-warning/30 bg-warning/10",
  destructive: "border-destructive/30 bg-destructive/8",
};

const CALLOUT_ICON: Record<CalloutTone, string> = {
  default: "bg-primary/12 text-primary",
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

/** Информационный/статусный блок с иконкой и опциональным действием. */
export function Callout({
  title,
  children,
  icon: Icon,
  tone = "default",
  action,
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  tone?: CalloutTone;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-panel border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
        CALLOUT_STYLES[tone],
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              CALLOUT_ICON[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          {title && <p className="text-sm font-medium leading-snug">{title}</p>}
          {children && (
            <div
              className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                title && "mt-0.5",
              )}
            >
              {children}
            </div>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2 sm:pl-2">{action}</div>}
    </div>
  );
}

/** Аватар с инициалом — единый вид в списках клиентов/навигации. */
export function Avatar({
  name,
  size = "md",
  className,
}: {
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initial = (name?.trim() || "?").charAt(0).toUpperCase();
  const sizes = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-sm",
    lg: "h-12 w-12 text-base",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/8 font-semibold text-primary ring-1 ring-inset ring-primary/10",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}

/** Круговой индикатор прогресса (привычки, % плана). */
export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/80"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-500 ease-spring"
        />
      </svg>
      {children && (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">
          {children}
        </span>
      )}
    </div>
  );
}

export type StatTone = "default" | "success" | "info" | "warning" | "destructive";

const STAT_TONES: Record<StatTone, string> = {
  default: "text-primary bg-primary/12",
  success: "text-success bg-success/12",
  info: "text-info bg-info/12",
  warning: "text-warning bg-warning/12",
  destructive: "text-destructive bg-destructive/12",
};

/** KPI-карточка: крупное число + подпись + иконка. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  className,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: string;
  className?: string;
  /** Если задан — карточка кликабельна (обернуть снаружи Link). */
  href?: never;
}) {
  void href;
  return (
    <Card className={cn("group relative overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold leading-tight tracking-tight tabular-nums sm:text-[1.65rem]">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
          {hint && (
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border/60 sm:h-11 sm:w-11",
              STAT_TONES[tone],
            )}
          >
            <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Карточка-ссылка для быстрых действий / списков. */
export function ActionCard({
  title,
  description,
  icon: Icon,
  meta,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  meta?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-interactive flex items-center gap-3 p-3.5 sm:p-4",
        className,
      )}
    >
      {Icon && (
        <div className="icon-well h-11 w-11">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-snug">{title}</p>
        {description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      {meta && <div className="flex shrink-0 items-center gap-2">{meta}</div>}
    </div>
  );
}

/** Узкий экран (< md). Для выбора мобильных раскладок вместо обрезанных таблиц. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
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
  return (
    <div className="w-full overflow-x-auto overscroll-x-contain rounded-panel">{children}</div>
  );
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
