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
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Users,
    title: "CRM и воронка клиентов",
    text: "Канбан по статусам: заявка → анкета → созвон → оплата → активный. Авто-метка «зона риска» при 7+ днях без активности.",
  },
  {
    icon: ClipboardList,
    title: "Конструктор тренировок",
    text: "Библиотека упражнений с техникой и видео. Соберите программу и назначьте клиенту в один клик.",
  },
  {
    icon: Dumbbell,
    title: "Кабинет и дневник клиента",
    text: "Клиент видит программу, вводит подходы, вес и ощущения, отмечает выполнение — прямо с телефона.",
  },
  {
    icon: LineChart,
    title: "Аналитика прогресса",
    text: "Прогрессия рабочих весов, посещаемость, % плана, субъективная тяжесть и динамика замеров.",
  },
  {
    icon: FileText,
    title: "Отчёты-конструктор",
    text: "Своя форма еженедельного отчёта. Статусы «ожидает проверки / проверен / пропущен» — ничего не теряется.",
  },
  {
    icon: CheckSquare,
    title: "Задачи и привычки",
    text: "Недельные привычки (шаги, вода, сон) с отметками по дням и автоматическим % соблюдения.",
  },
  {
    icon: BookOpen,
    title: "База знаний",
    text: "Материалы по категориям с поэтапным открытием по неделям сопровождения.",
  },
  {
    icon: Wallet,
    title: "Финансы",
    text: "История оплат, статусы и продления, напоминания клиенту — без сторонних таблиц.",
  },
];

const STEPS = [
  { n: "01", title: "Заводите клиента", text: "Создаёте карточку, клиент заполняет анкету в своём кабинете." },
  { n: "02", title: "Собираете программу", text: "Из библиотеки упражнений и шаблонов — назначаете в один клик." },
  { n: "03", title: "Клиент тренируется", text: "Ведёт дневник, сдаёт замеры, фото и отчёты со смартфона." },
  { n: "04", title: "Видите прогресс", text: "Графики, посещаемость и сводка рисков — на одном экране." },
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

// Живые экраны веб-кабинета (client/public/screens/, свежие снимки UI).
const APP_SCREENS = [
  {
    src: "/screens/trainer-dashboard.png",
    role: "Тренер",
    title: "Дашборд",
    text: "Зона риска, заявки и проверки — за 10 секунд",
  },
  {
    src: "/screens/trainer-clients.png",
    role: "Тренер",
    title: "CRM-воронка",
    text: "От заявки до активного — статусы под контролем",
  },
  {
    src: "/screens/trainer-client-card.png",
    role: "Тренер",
    title: "Карточка клиента",
    text: "Анкета, программа, прогресс и следующий шаг воронки",
  },
  {
    src: "/screens/trainer-analytics.png",
    role: "Тренер",
    title: "Аналитика",
    text: "Тоннаж, оценка 1ПМ и рост рабочих весов",
  },
  {
    src: "/screens/trainer-studio.png",
    role: "Тренер",
    title: "Конструктор",
    text: "Программы с отдыхом 30с–5м и суперсетами",
  },
  {
    src: "/screens/client-home.png",
    role: "Клиент",
    title: "Кабинет спортсмена",
    text: "Ближайшая тренировка и быстрый доступ",
  },
  {
    src: "/screens/client-workout-log.png",
    role: "Клиент",
    title: "Дневник в зале",
    text: "Крупные подходы, таймер отдыха, sticky «Завершить»",
  },
  {
    src: "/screens/client-progress.png",
    role: "Клиент",
    title: "Прогресс",
    text: "Тоннаж, 1ПМ, серия недель и замеры",
  },
  {
    src: "/screens/client-home-mobile.png",
    role: "Клиент",
    title: "С телефона",
    text: "Нижняя навигация — всё под рукой в зале",
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

      {/* Возможности */}
      <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <SectionHeading
          eyebrow="Возможности"
          title="Всё, что нужно онлайн-тренеру"
          subtitle="Восемь модулей вместо десятка разрозненных инструментов. Чисто, быстро, на русском."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group relative flex flex-col overflow-hidden rounded-panel border border-border/70 bg-card p-5 shadow-surface transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-panel"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10 transition-all group-hover:from-primary/20 group-hover:shadow-glow">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="font-semibold leading-snug">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section id="how" className="scroll-mt-20 border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <SectionHeading
            eyebrow="Как это работает"
            title="Сквозной сценарий тренер ↔ клиент"
            subtitle="От заявки до прогресса на графиках — без переключения между сервисами."
          />
          <div className="relative grid gap-4 md:grid-cols-4 md:gap-5">
            {/* connector line desktop */}
            <div
              className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 md:block"
              aria-hidden
            />
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="glass-card relative rounded-panel p-6 transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-panel"
              >
                <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold tracking-wide text-primary-foreground shadow-glow">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Приложение */}
      <section id="app" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <SectionHeading
          eyebrow="Живой продукт"
          title="Как выглядит FitPro изнутри"
          subtitle="Реальные экраны кабинета тренера и клиента. Веб уже работает с телефона; нативное iOS/Android — в разработке."
        />
        <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          <div className="flex snap-x snap-mandatory gap-5 md:gap-6">
            {APP_SCREENS.map((s) => (
              <figure key={s.src} className="w-[210px] shrink-0 snap-center sm:w-[230px]">
                <div className="group relative mx-auto w-full overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-1.5 shadow-panel transition-transform duration-300 ease-spring hover:-translate-y-1">
                  {/* phone notch bar */}
                  <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5">
                    <div className="h-1.5 w-16 rounded-full bg-foreground/15" />
                  </div>
                  <div className="overflow-hidden rounded-[1.35rem] bg-muted/40">
                    <img
                      src={s.src}
                      alt={`${s.title} — экран iOS-приложения FitPro`}
                      loading="lazy"
                      width={1179}
                      height={2556}
                      className="block w-full transition-transform duration-500 ease-spring group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
                <figcaption className="mt-3.5 text-center">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {s.role}
                  </span>
                  <p className="mt-1.5 text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Листайте галерею — актуальные экраны веб-кабинета
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

      {/* Футер */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
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
