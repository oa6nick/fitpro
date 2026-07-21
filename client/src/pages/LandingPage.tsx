import { Link } from "react-router-dom";
import {
  Dumbbell,
  Users,
  ClipboardList,
  LineChart,
  FileText,
  CheckSquare,
  BookOpen,
  Wallet,
  Bell,
  ArrowRight,
  Check,
  Smartphone,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StoreBadges } from "@/components/StoreBadges";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Users,
    title: "CRM и воронка",
    text: "Канбан: заявка → анкета → созвон → оплата → активный. Авто-метка «зона риска» при 7+ днях без активности.",
    span: "lg:col-span-2",
  },
  {
    icon: ClipboardList,
    title: "Конструктор программ",
    text: "Библиотека с техникой и видео. Суперсеты, отдых 30с–5м, назначение в один клик.",
    span: "",
  },
  {
    icon: Dumbbell,
    title: "Дневник в зале",
    text: "Клиент вводит подходы, вес и ощущения с телефона. Таймер отдыха и sticky «Завершить».",
    span: "",
  },
  {
    icon: LineChart,
    title: "Аналитика",
    text: "Тоннаж, оценка 1ПМ, рост рабочих весов, посещаемость и замеры — для тренера и клиента.",
    span: "lg:col-span-2",
  },
  {
    icon: FileText,
    title: "Отчёты",
    text: "Своя форма недели. Статусы проверки — ничего не теряется в чатах.",
    span: "",
  },
  {
    icon: CheckSquare,
    title: "Привычки",
    text: "Шаги, вода, сон — отметки по дням и % соблюдения автоматически.",
    span: "",
  },
  {
    icon: BookOpen,
    title: "База знаний",
    text: "Материалы с поэтапным открытием по неделям сопровождения.",
    span: "",
  },
  {
    icon: Wallet,
    title: "Финансы",
    text: "Оплаты, продления и напоминания — без сторонних таблиц.",
    span: "",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Заводите клиента",
    text: "Карточка + ссылка-приглашение. Клиент заполняет анкету сам.",
    tip: "2 минуты",
  },
  {
    n: "02",
    title: "Собираете программу",
    text: "Из библиотеки упражнений — шаблон и назначение в один клик.",
    tip: "Конструктор",
  },
  {
    n: "03",
    title: "Клиент тренируется",
    text: "Дневник, замеры и отчёты со смартфона. Вы видите логи сразу.",
    tip: "В зале",
  },
  {
    n: "04",
    title: "Корректируете план",
    text: "Графики, зона риска и проверка тренировок — на одном экране.",
    tip: "Аналитика",
  },
];

// Цифры синхронизированы с серверным прайсом (server/src/services/plans.ts).
const PRICING = [
  { id: "basic", name: "Старт", price: "990", clients: "до 10 клиентов", popular: false },
  { id: "pro", name: "Практик", price: "2 490", clients: "до 50 клиентов", popular: true },
  { id: "expert", name: "Студия", price: "4 990", clients: "до 100 клиентов", popular: false },
];

const AUDIENCE = [
  {
    icon: Dumbbell,
    title: "Онлайн-тренер",
    text: "Ведёте 10–50 клиентов удалённо: программы, дневники и отчёты вместо переписок и таблиц.",
  },
  {
    icon: Users,
    title: "Тренер в зале с ведением",
    text: "Очные тренировки + сопровождение между ними: задачи, привычки, замеры — всё под контролем.",
  },
  {
    icon: ClipboardList,
    title: "Нутрициолог / куратор",
    text: "Анкеты, еженедельные отчёты, база знаний с поэтапным доступом и метка «зона риска».",
  },
];

// 5 лучших мобильных экранов + lightbox.
const APP_SCREENS = [
  {
    src: "/screens/m-trainer-home.png",
    role: "Тренер",
    title: "Дашборд",
    text: "Зона риска и задачи на сегодня",
  },
  {
    src: "/screens/m-trainer-clients.png",
    role: "Тренер",
    title: "CRM",
    text: "Воронка клиентов в кармане",
  },
  {
    src: "/screens/m-trainer-analytics.png",
    role: "Тренер",
    title: "Аналитика",
    text: "Тоннаж, 1ПМ, динамика весов",
  },
  {
    src: "/screens/m-client-diary.png",
    role: "Клиент",
    title: "Дневник",
    text: "Подходы и таймер — прямо в зале",
  },
  {
    src: "/screens/m-client-progress.png",
    role: "Клиент",
    title: "Прогресс",
    text: "Тоннаж, серия и замеры",
  },
];

const FAQ = [
  {
    q: "Как клиент попадает в свой кабинет?",
    a: "Вы создаёте карточку клиента и отправляете ему ссылку-приглашение (или письмо). Клиент придумывает пароль — и сразу видит свои тренировки, дневник и отчёты. Сам зарегистрироваться «мимо тренера» клиент не может.",
  },
  {
    q: "Что входит в бесплатный период?",
    a: "14 дней полного функционала и до 10 клиентов. Банковская карта не нужна.",
  },
  {
    q: "Как оплачивать после пробного периода?",
    a: "Онлайн-оплата сейчас подключается. До её запуска тариф активируется вручную — напишите нам, это занимает пару минут.",
  },
  {
    q: "Клиенту нужно ставить приложение?",
    a: "Нет. FitPro работает в браузере и полностью адаптирован под телефон — кабинет клиента открывается по ссылке.",
  },
  {
    q: "Что с моими данными и данными клиентов?",
    a: "Данные хранятся в изолированной базе, доступ к клиенту есть только у его тренера. Пароли хранятся в виде хэшей, доступ к кабинету — по защищённой сессии.",
  },
  {
    q: "Можно ли перенести клиентов из таблиц?",
    a: "Да: карточки клиентов заводятся быстро, а анкету каждый клиент заполняет сам при первом входе — вам не придётся перепечатывать данные.",
  },
];

const STATS = [
  { icon: Zap, label: "Назначение программы", value: "в 1 клик" },
  { icon: Smartphone, label: "Кабинет клиента", value: "с телефона" },
  { icon: Bell, label: "Зона риска", value: "автоматически" },
  { icon: ShieldCheck, label: "Две роли", value: "тренер и клиент" },
];

function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6 rounded-md" : "h-9 w-9 rounded-xl";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5 h-[18px] w-[18px]";
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary text-primary-foreground shadow-glow",
        box,
      )}
    >
      <Dumbbell className={icon} />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("mb-12", align === "center" ? "text-center" : "text-left")}>
      <p className="type-eyebrow mb-3 text-primary/80">{eyebrow}</p>
      <h2 className="type-section-title">{title}</h2>
      {subtitle && (
        <p
          className={cn(
            "mt-3 max-w-2xl leading-relaxed text-muted-foreground",
            align === "center" && "mx-auto",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Навигация */}
      <header className="glass-header sticky top-0 z-40 border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">FitPro</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
            {[
              { href: "#features", label: "Возможности" },
              { href: "#how", label: "Как это работает" },
              { href: "#app", label: "Приложение" },
              { href: "#pricing", label: "Тарифы" },
              { href: "#faq", label: "Вопросы" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/for-clients"
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              Клиентам
            </Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Войти</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">
                Начать <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — split layout */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 85% 10%, hsl(var(--primary) / 0.16), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 30%, hsl(var(--info) / 0.10), transparent 50%), radial-gradient(ellipse 40% 30% at 50% 90%, hsl(var(--primary) / 0.06), transparent 60%)",
          }}
          aria-hidden
        />
        {/* soft grid */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground) / 0.04) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black, transparent)",
          }}
          aria-hidden
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-24">
          <div className="animate-slide-up text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-surface">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15">
                <Sparkles className="h-3 w-3 text-primary" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Для онлайн-тренеров
              </span>
            </div>

            <h1 className="type-display mx-auto max-w-2xl lg:mx-0">
              Клиенты, программы и прогресс —{" "}
              <span className="text-primary">без хаоса в чатах</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.75] text-muted-foreground sm:text-lg lg:mx-0">
              CRM, дневник в зале, тоннаж и 1ПМ, отчёты и зона риска. Всё, что Fitness Form
              и таблицы не закрывают вместе — в одном кабинете на русском.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/register">
                  14 дней бесплатно <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
                <Link to="/login">Войти</Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-12 text-base" asChild>
                <Link to="/for-clients">Я клиент</Link>
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> без карты
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> до 10 клиентов на старте
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> кабинет с телефона
              </span>
            </div>
          </div>

          <div className="relative animate-scale-in [animation-delay:120ms]">
            <DashboardMock />
            {/* floating chips */}
            <div className="pointer-events-none absolute -left-2 top-8 hidden animate-slide-up sm:block lg:-left-6">
              <div className="glass-elevated flex items-center gap-2 rounded-full px-3 py-2 shadow-panel">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <Bell className="h-3.5 w-3.5" />
                </span>
                <div className="pr-1 text-left">
                  <p className="text-[11px] font-semibold leading-none">Зона риска</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">2 клиента без активности</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-3 right-2 hidden animate-slide-up sm:block lg:-right-4 [animation-delay:200ms]">
              <div className="glass-elevated flex items-center gap-2 rounded-full px-3 py-2 shadow-panel">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success">
                  <LineChart className="h-3.5 w-3.5" />
                </span>
                <div className="pr-1 text-left">
                  <p className="text-[11px] font-semibold leading-none">+12% прогресс</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">рабочие веса за месяц</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Метрики */}
      <section className="relative border-y border-border/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-8 md:grid-cols-4 md:gap-4 md:py-10">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-panel border border-border/60 bg-card/70 p-5 text-center shadow-surface backdrop-blur-sm transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-primary/25 hover:shadow-panel"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-lg font-semibold tracking-tight sm:text-xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности — bento */}
      <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <SectionHeading
          eyebrow="Возможности"
          title="Один кабинет вместо десяти инструментов"
          subtitle="CRM, программы, дневник, аналитика и финансы — на русском, без хаоса в Telegram и таблицах."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-surface transition-all duration-200 hover:border-primary/35 hover:shadow-panel",
                f.span,
                i === 0 && "bg-gradient-to-br from-primary/[0.07] via-card to-card",
                i === 3 && "bg-gradient-to-br from-card via-card to-primary/[0.06]",
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/10">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-muted-foreground/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              <div className="mt-4 h-0.5 w-8 rounded-full bg-primary/40 transition-all group-hover:w-14 group-hover:bg-primary" />
            </div>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section id="how" className="scroll-mt-20 border-y border-border/60 bg-muted/35">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <SectionHeading
            eyebrow="Как это работает"
            title="От заявки до прогресса — четыре шага"
            subtitle="Сквозной сценарий тренер ↔ клиент без переключений между сервисами."
          />
          <ol className="grid gap-4 md:grid-cols-4 md:gap-0">
            {STEPS.map((s, i) => (
              <li key={s.n} className="relative flex md:block">
                {i < STEPS.length - 1 && (
                  <span
                    className="absolute left-6 top-14 hidden h-[calc(100%-2rem)] w-px bg-border md:left-auto md:right-0 md:top-8 md:h-px md:w-full md:bg-gradient-to-r md:from-primary/40 md:to-primary/10"
                    aria-hidden
                  />
                )}
                <div className="relative z-[1] flex w-full flex-col rounded-2xl border border-border bg-card p-5 shadow-surface md:mx-1.5 md:min-h-[220px]">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      {s.n}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.tip}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Приложение — 5 mobile + lightbox */}
      <section id="app" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <SectionHeading
          eyebrow="В телефоне"
          title="Нажмите на экран — откроется крупно"
          subtitle="Пять живых мобильных кадров. Клик или «Открыть крупно» — полноэкранный просмотр."
        />
        <ScreenshotGallery screens={APP_SCREENS} />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Веб уже работает с телефона · нативные приложения — в блоке «Скачать»
        </p>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <SectionHeading
          eyebrow="Тарифы"
          title="Простые тарифы"
          subtitle="Платите за объём клиентов. Все функции — в каждом тарифе."
        />
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3 sm:items-stretch">
          {PRICING.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-hero border bg-card p-6 shadow-surface transition-all duration-300 ease-spring hover:-translate-y-1.5",
                p.popular
                  ? "z-10 border-primary/40 shadow-glow ring-1 ring-primary/30 sm:scale-[1.03]"
                  : "border-border/70 hover:shadow-panel",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                  Популярный
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">{p.price}</span>
                <span className="text-sm text-muted-foreground">₽/мес</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.clients}</p>
              <div className="my-5 h-px bg-border/70" />
              <ul className="flex-1 space-y-2.5 text-sm">
                {["CRM и воронка", "Программы и дневник", "Отчёты и аналитика", "База знаний и финансы"].map(
                  (li) => (
                    <li key={li} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary/12">
                        <Check className="h-3 w-3 text-primary" />
                      </span>
                      {li}
                    </li>
                  ),
                )}
              </ul>
              <Button
                className={cn("mt-7 w-full", p.popular && "shadow-glow")}
                variant={p.popular ? "default" : "outline"}
                asChild
              >
                <Link to={`/register?plan=${p.id}`}>
                  Начать бесплатно
                  {p.popular && <ArrowRight className="h-4 w-4" />}
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
          Каждый тариф начинается с 14 дней бесплатно. Онлайн-оплата подключается — до её запуска
          тариф активируется вручную.
        </p>
      </section>

      {/* Для кого */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <SectionHeading eyebrow="Для кого" title="Кому подходит FitPro" />
          <div className="grid gap-4 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div
                key={a.title}
                className="group glass-card relative overflow-hidden rounded-panel p-6 transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-panel"
              >
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Подходит вам <ChevronRight className="h-3.5 w-3.5" />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-20 md:py-24">
        <SectionHeading eyebrow="FAQ" title="Частые вопросы" />
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group glass-card rounded-panel px-5 py-4 transition-shadow open:shadow-panel"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                <span className="pr-2">{item.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-all duration-200 group-open:rotate-45 group-open:border-primary/30 group-open:bg-primary/10 group-open:text-primary">
                  +
                </span>
              </summary>
              <p className="mt-3 border-t border-border/50 pt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 md:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-hero border border-border/60 bg-card shadow-panel">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 0% 50%, hsl(var(--primary) / 0.14), transparent 55%), radial-gradient(ellipse 50% 70% at 100% 50%, hsl(var(--info) / 0.10), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative flex flex-col items-start justify-between gap-8 px-6 py-12 sm:px-10 md:flex-row md:items-center md:py-14">
            <div className="max-w-xl">
              <p className="type-eyebrow mb-3 text-primary/80">Начните сегодня</p>
              <h2 className="type-section-title">Соберите своё пространство тренера</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Зарегистрируйтесь и пригласите первого клиента за пару минут. 14 дней бесплатно.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button size="lg" className="h-12 px-8 shadow-glow" asChild>
                <Link to="/register">
                  Создать аккаунт тренера <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <Link to="/login">Войти</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Сторы */}
      <section className="border-t border-border/50 bg-muted/25">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <p className="type-eyebrow mb-2">Скачать</p>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                FitPro в магазинах приложений
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Веб-кабинет работает уже сейчас. Нативные приложения — в RuStore и скоро в App Store
                и Google Play.
              </p>
            </div>
            <StoreBadges />
            <p className="text-xs text-muted-foreground">
              Пока нет приложения — откройте{" "}
              <a href="https://fitpro.oasixlab.com" className="font-medium text-primary hover:underline">
                fitpro.oasixlab.com
              </a>{" "}
              в браузере телефона
            </p>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="font-semibold text-foreground">FitPro Platform</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/for-clients" className="transition-colors hover:text-foreground">
              FitPro для клиента
            </Link>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Тарифы
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <a href="#app" className="transition-colors hover:text-foreground">
              Экраны
            </a>
          </div>
          <p className="text-xs">© 2026 FitPro · ОС для онлайн-тренера</p>
        </div>
      </footer>
    </div>
  );
}

/** Декоративный CSS-макет дашборда (без внешних картинок), в стеклянной эстетике. */
function DashboardMock() {
  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
      {/* ambient glow behind mock */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, hsl(var(--primary) / 0.18), transparent 65%)",
        }}
        aria-hidden
      />
      <div className="glass-elevated overflow-hidden rounded-hero shadow-panel dark:shadow-glow">
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-2 flex-1 truncate rounded-md bg-muted/60 px-2.5 py-1 text-[11px] text-muted-foreground">
            app.fitpro · Главная тренера
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3 text-left sm:grid-cols-5 sm:gap-2.5 sm:p-4">
          {[
            { label: "Всего", value: "24" },
            { label: "Активные", value: "18", accent: "text-success" },
            { label: "Заявки", value: "3" },
            { label: "Зона риска", value: "2", accent: "text-destructive" },
            { label: "Заканчивают", value: "1", accent: "text-warning" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-border/50 bg-card/70 p-2.5 sm:p-3"
            >
              <p className={cn("text-xl font-semibold tabular-nums sm:text-2xl", c.accent)}>
                {c.value}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">{c.label}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2.5 px-3 pb-3 sm:grid-cols-3 sm:gap-3 sm:px-4 sm:pb-4">
          {[
            { title: "Новые заявки", badge: "sky" as const, rows: ["Анна К.", "Игорь М."] },
            { title: "Зона риска", badge: "warning" as const, rows: ["Мария С.", "Павел Д."] },
            { title: "Лучший прогресс", badge: "success" as const, rows: ["Елена В.", "Артём Н."] },
          ].map((t) => (
            <div
              key={t.title}
              className="rounded-xl border border-border/50 bg-card/70 p-3"
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold">{t.title}</p>
                <Badge variant={t.badge} className="shrink-0 px-1.5 py-0 text-[10px]">
                  {t.rows.length}
                </Badge>
              </div>
              {t.rows.map((name) => (
                <div key={name} className="mb-1.5 flex items-center justify-between gap-2 last:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
                      {name.charAt(0)}
                    </span>
                    <span className="text-[11px] text-foreground/80">{name}</span>
                  </div>
                  <div className="h-1.5 w-8 rounded-full bg-primary/25" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
