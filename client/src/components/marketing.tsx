import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Общие примитивы лендингов тренера и клиента — одна композиция. */

export function MktSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  narrow,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  /** Узкий контент (таймлайн, FAQ) */
  narrow?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 px-4 py-16 md:py-20", className)}>
      <div className={cn("mx-auto", narrow ? "max-w-3xl" : "max-w-6xl")}>
        <header className={cn("mb-10 md:mb-12", narrow ? "text-center" : "max-w-2xl")}>
          <p className="type-eyebrow mb-3">{eyebrow}</p>
          <h2 className="type-section-title text-balance">{title}</h2>
          {subtitle && (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}

/** Двухколоночный блок: заголовок слева, список справа. */
export function MktSplit({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 px-4 py-16 md:py-20", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="type-eyebrow mb-3">{eyebrow}</p>
          <h2 className="type-section-title text-balance">{title}</h2>
          {subtitle && (
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

export type MktFeature = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export function MktFeatureList({ items }: { items: MktFeature[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((f) => (
        <li key={f.title} className="flex gap-4 py-5 sm:gap-5 sm:py-6">
          <f.icon
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          <div className="min-w-0">
            <h3 className="text-[1.05rem] font-semibold tracking-tight">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
              {f.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export type MktStep = {
  title: string;
  text: string;
  tip?: string;
};

export function MktTimeline({ steps }: { steps: MktStep[] }) {
  return (
    <ol className="relative space-y-0">
      <span
        className="absolute bottom-3 left-[0.95rem] top-3 w-px bg-border md:left-[1.05rem]"
        aria-hidden
      />
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-5 pb-10 last:pb-0 md:gap-7">
          <span className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary md:h-9 md:w-9">
            {i + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            {s.tip && <p className="text-xs font-medium text-muted-foreground">{s.tip}</p>}
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {s.text}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function MktBand({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-y border-border/60 bg-muted/30", className)}>{children}</div>
  );
}

export function MktCardGrid({
  children,
  cols = 3,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 md:grid-cols-3",
        cols === 4 && "grid-cols-2 md:grid-cols-4",
      )}
    >
      {children}
    </div>
  );
}

export function MktCard({
  icon: Icon,
  title,
  text,
  badge,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-surface transition-colors hover:border-primary/25 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        {badge && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

export function MktFaq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-surface open:shadow-panel"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium tracking-tight [&::-webkit-details-marker]:hidden">
            <span className="pr-2 text-left">{item.q}</span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all group-open:rotate-45 group-open:border-primary/30 group-open:bg-primary/10 group-open:text-primary">
              +
            </span>
          </summary>
          <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

export function MktNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
      <p className="font-medium text-foreground">{title}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

/** Финальный CTA-баннер (один на страницу — не дублируем кнопки хедера). */
export function MktCtaBanner({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pb-16 md:pb-20">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-panel">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 80% at 0% 50%, hsl(var(--primary) / 0.1), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col items-start justify-between gap-8 px-6 py-12 sm:px-10 md:flex-row md:items-center md:py-14">
          <div className="max-w-xl">
            <p className="type-eyebrow mb-3">{eyebrow}</p>
            <h2 className="type-section-title text-balance">{title}</h2>
            {subtitle && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

export type DemoAccount = {
  role: string;
  email: string;
  password: string;
  name?: string;
};

/** Блок демо-доступа — одинаковый на лендингах тренера и клиента. */
export function MktDemoAccess({
  accounts,
  subtitle = "Готовые аккаунты на fitpro.oasixlab.com — можно сразу зайти и посмотреть кабинет.",
}: {
  accounts: DemoAccount[];
  subtitle?: string;
}) {
  return (
    <section id="demo" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="type-eyebrow mb-3">Демо</p>
          <h2 className="type-section-title text-balance">Попробуйте без регистрации</h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((a) => (
            <div
              key={a.email}
              className="rounded-2xl border border-border bg-card p-5 shadow-surface sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">{a.role}</p>
              {a.name && (
                <p className="mt-1 text-sm font-medium text-foreground">{a.name}</p>
              )}
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Логин</dt>
                  <dd className="font-mono text-[13px] font-medium tracking-tight text-foreground">
                    {a.email}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">Пароль</dt>
                  <dd className="font-mono text-[13px] font-medium tracking-tight text-foreground">
                    {a.password}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
