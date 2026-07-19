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
    text: "Прогрессия рабочих весов, посещаемость, выполнение плана, субъективная тяжесть и динамика замеров.",
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
  { n: "1", title: "Заводите клиента", text: "Создаёте карточку, клиент заполняет анкету в своём кабинете." },
  { n: "2", title: "Собираете программу", text: "Из библиотеки упражнений и шаблонов — назначаете в один клик." },
  { n: "3", title: "Клиент тренируется", text: "Ведёт дневник, сдаёт замеры, фото и отчёты со смартфона." },
  { n: "4", title: "Видите прогресс", text: "Графики, посещаемость и сводка рисков — на одном экране." },
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

// Живые экраны iOS-приложения (client/public/screens/).
const APP_SCREENS = [
  {
    src: "/screens/trainer-dashboard.png",
    role: "Тренер",
    title: "Дашборд",
    text: "Клиенты, заявки и зона риска — одним взглядом",
  },
  {
    src: "/screens/trainer-client-card.png",
    role: "Тренер",
    title: "Карточка клиента",
    text: "Тренировки, анкета, замеры и заметки в одном месте",
  },
  {
    src: "/screens/trainer-studio.png",
    role: "Тренер",
    title: "Студия",
    text: "Упражнения, шаблоны, привычки и материалы",
  },
  {
    src: "/screens/trainer-profile.png",
    role: "Тренер",
    title: "Подписка и финансы",
    text: "Тариф, оплаты и уведомления — под контролем",
  },
  {
    src: "/screens/client-workouts.png",
    role: "Клиент",
    title: "Тренировки",
    text: "Назначенные программы со статусами",
  },
  {
    src: "/screens/client-workout-log.png",
    role: "Клиент",
    title: "Дневник тренировки",
    text: "Подходы, вес и повторы — прямо в зале",
  },
  {
    src: "/screens/onboarding-diary.png",
    role: "Клиент",
    title: "Дневник всегда рядом",
    text: "Программа от тренера в телефоне, таймер отдыха подскажет паузу",
  },
  {
    src: "/screens/onboarding-progress.png",
    role: "Клиент",
    title: "Прогресс на ладони",
    text: "Замеры, фото «до/после» и привычки недели",
  },
  {
    src: "/screens/onboarding-coach.png",
    role: "Клиент",
    title: "Тренер всегда рядом",
    text: "Проверка дневников и еженедельные отчёты",
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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Навигация */}
      <header className="glass-header sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FitPro</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Возможности</a>
            <a href="#how" className="transition-colors hover:text-foreground">Как это работает</a>
            <a href="#app" className="transition-colors hover:text-foreground">Приложение</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Тарифы</a>
            <a href="#faq" className="transition-colors hover:text-foreground">Вопросы</a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">Войти</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Начать</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* page-glow: мягкие свечения в тонах бренда, без внешних ассетов */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
          style={{
            background:
              "radial-gradient(circle at 72% 12%, hsl(var(--primary) / 0.14), transparent 34%), radial-gradient(circle at 22% 22%, hsl(var(--info) / 0.10), transparent 30%)",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <div className="glass-card mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5">
            <Zap className="h-3 w-3 text-primary" />
            <span className="type-eyebrow">Операционная система для онлайн-тренера</span>
          </div>
          <h1 className="type-display mx-auto max-w-3xl">
            Всё ведение клиентов — <span className="text-primary">в одном месте</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.82] text-muted-foreground">
            FitPro заменяет Telegram, таблицы, заметки, PDF и платёжные ссылки единым пространством:
            CRM, программы тренировок, дневник клиента, отчёты, аналитика и финансы.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Попробовать бесплатно <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Войти в кабинет</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14 дней бесплатно · банковская карта не нужна
          </p>

          <DashboardMock />
        </div>
      </section>

      {/* Преимущества-строка (MetricPill-паттерн) */}
      <section className="border-y border-border/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 md:grid-cols-4">
          {[
            { icon: Zap, label: "Назначение программы", value: "в 1 клик" },
            { icon: Smartphone, label: "Кабинет клиента", value: "с телефона" },
            { icon: Bell, label: "Зона риска", value: "автоматически" },
            { icon: ShieldCheck, label: "Две роли", value: "тренер и клиент" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-panel px-4 py-5 text-center">
              <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-lg font-medium">{s.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Возможности</p>
          <h2 className="type-section-title">Всё, что нужно онлайн-тренеру</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Восемь модулей вместо десятка разрозненных инструментов. Чисто, быстро, на русском.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-panel border border-border/70 bg-card p-5 shadow-surface transition-all duration-200 ease-spring hover:-translate-y-1 hover:shadow-panel"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Как это работает */}
      <section id="how" className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <p className="type-eyebrow mb-3">Как это работает</p>
            <h2 className="type-section-title">Сквозной сценарий тренер ↔ клиент</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              От заявки до прогресса на графиках — без переключения между сервисами.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="glass-card relative rounded-panel p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Приложение: живые экраны iOS */}
      <section id="app" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Мобильное приложение</p>
          <h2 className="type-section-title">FitPro в вашем телефоне</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Нативное iOS-приложение для тренера и клиента — вот его живые экраны.
            Скоро в App Store; веб-версия полностью работает с телефона уже сейчас.
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-4">
          <div className="flex snap-x gap-5 md:gap-6">
            {APP_SCREENS.map((s) => (
              <figure key={s.src} className="w-[220px] shrink-0 snap-center sm:w-[240px]">
                <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-panel">
                  <img
                    src={s.src}
                    alt={`${s.title} — экран iOS-приложения FitPro`}
                    loading="lazy"
                    width={1179}
                    height={2556}
                    className="block w-full"
                  />
                </div>
                <figcaption className="mt-3 text-center">
                  <span className="text-xs font-medium text-primary">{s.role}</span>
                  <p className="mt-0.5 text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Листайте галерею вбок — 9 экранов приложения
        </p>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Тарифы</p>
          <h2 className="type-section-title">Простые тарифы</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Платите за объём клиентов. Все функции — в каждом тарифе.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-panel border border-border/70 bg-card p-6 shadow-surface transition-all duration-200 ease-spring hover:-translate-y-1 hover:shadow-panel",
                p.popular && "ring-1 ring-primary shadow-glow",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Популярный
                </span>
              )}
              <h3 className="font-semibold">{p.name}</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold">{p.price}</span>
                <span className="text-muted-foreground"> ₽/мес</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.clients}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {["CRM и воронка", "Программы и дневник", "Отчёты и аналитика", "База знаний и финансы"].map(
                  (li) => (
                    <li key={li} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> {li}
                    </li>
                  ),
                )}
              </ul>
              <Button className="mt-6 w-full" variant={p.popular ? "default" : "outline"} asChild>
                <Link to={`/register?plan=${p.id}`}>Начать бесплатно</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Каждый тариф начинается с 14 дней бесплатно. Онлайн-оплата подключается — до её запуска
          тариф активируется вручную.
        </p>
      </section>

      {/* Для кого */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <p className="type-eyebrow mb-3">Для кого</p>
            <h2 className="type-section-title">Кому подходит FitPro</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="glass-card rounded-panel p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-10 text-center">
          <p className="type-eyebrow mb-3">FAQ</p>
          <h2 className="type-section-title">Частые вопросы</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group glass-card rounded-panel px-5 py-4 open:shadow-panel"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA (CtaPanel-паттерн: border-y + alt-фон, текст слева / кнопки справа) */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center">
          <div>
            <p className="type-eyebrow mb-3">Начните сегодня</p>
            <h2 className="type-section-title max-w-xl">
              Соберите своё пространство тренера
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Зарегистрируйтесь и пригласите первого клиента за пару минут. 14 дней бесплатно.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/register">
                Создать аккаунт тренера <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Войти</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dumbbell className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">FitPro Platform</span>
          </div>
          <p>© 2026 FitPro. Операционная система для онлайн-тренера.</p>
        </div>
      </footer>
    </div>
  );
}

/** Декоративный CSS-макет дашборда (без внешних картинок), в стеклянной эстетике. */
function DashboardMock() {
  return (
    <div className="mx-auto mt-14 max-w-4xl">
      <div className="glass-elevated overflow-hidden rounded-hero shadow-panel dark:shadow-glow">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-warning/60" />
          <span className="h-3 w-3 rounded-full bg-success/60" />
          <span className="ml-3 text-xs text-muted-foreground">FitPro · Главная тренера</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4 text-left md:grid-cols-5">
          {[
            { label: "Всего", value: "24" },
            { label: "Активные", value: "18", accent: "text-success" },
            { label: "Заявки", value: "3" },
            { label: "Зона риска", value: "2", accent: "text-destructive" },
            { label: "Заканчивают", value: "1", accent: "text-warning" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border/60 bg-card/60 p-3">
              <p className={cn("text-2xl font-semibold tabular-nums", c.accent)}>{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
          {[
            { title: "Новые заявки", badge: "sky" as const },
            { title: "Зона риска", badge: "warning" as const },
            { title: "Лучший прогресс", badge: "success" as const },
          ].map((t) => (
            <div key={t.title} className="rounded-xl border border-border/60 bg-card/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">{t.title}</p>
                <Badge variant={t.badge} className="px-1.5 py-0 text-[10px]">
                  2
                </Badge>
              </div>
              {[0, 1].map((r) => (
                <div key={r} className="mb-1.5 flex items-center justify-between">
                  <div className="h-2 w-20 rounded bg-muted" />
                  <div className="h-2 w-8 rounded bg-primary/30" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
