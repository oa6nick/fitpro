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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StoreBadges } from "@/components/StoreBadges";
import { ScreenshotGallery } from "@/components/ScreenshotGallery";
import {
  MktSplit,
  MktFeatureList,
  MktTimeline,
  MktBand,
  MktSection,
  MktCardGrid,
  MktCard,
  MktFaq,
  MktCtaBanner,
  MktDemoAccess,
} from "@/components/marketing";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Users,
    title: "Клиенты и воронка",
    text: "От заявки до активного сопровождения — на одной доске. Если человек пропал на неделю, система сама подсветит его в «зоне риска».",
  },
  {
    icon: ClipboardList,
    title: "Программы тренировок",
    text: "Соберите план из своей библиотеки упражнений, задайте подходы и отдых — и отправьте клиенту одним нажатием.",
  },
  {
    icon: Dumbbell,
    title: "Дневник в телефоне",
    text: "Клиент отмечает вес и повторы прямо в зале. Есть таймер отдыха и кнопка «завершить тренировку».",
  },
  {
    icon: LineChart,
    title: "Прогресс на цифрах",
    text: "Тоннаж, рабочие веса, посещаемость и замеры. Видно, кто растёт, а кому пора поправить план.",
  },
  {
    icon: FileText,
    title: "Еженедельные отчёты",
    text: "Своя короткая форма вместо переписок. Статусы «ожидает» и «проверен» — ничего не теряется.",
  },
  {
    icon: CheckSquare,
    title: "Привычки",
    text: "Шаги, вода, сон — клиент отмечает дни, процент соблюдения считается сам.",
  },
  {
    icon: BookOpen,
    title: "Материалы",
    text: "Гайды и видео открываются по неделям ведения — когда они действительно нужны.",
  },
  {
    icon: Wallet,
    title: "Оплаты",
    text: "История платежей и даты продления. Напоминание клиенту — без Excel и личных сообщений.",
  },
];

const STEPS = [
  {
    title: "Добавьте клиента",
    text: "Создайте карточку и отправьте ссылку. Анкету человек заполнит сам.",
    tip: "Пара минут",
  },
  {
    title: "Соберите программу",
    text: "Из упражнений и шаблонов — назначьте на нужную дату.",
    tip: "Конструктор",
  },
  {
    title: "Клиент тренируется",
    text: "Ведёт дневник, сдаёт замеры и отчёты с телефона. Вы видите это сразу.",
    tip: "В зале",
  },
  {
    title: "Смотрите результат",
    text: "Графики, риски и проверка тренировок — всё на одном экране.",
    tip: "Аналитика",
  },
];

// Цифры синхронизированы с server/src/services/plans.ts
const PRICING = [
  { id: "basic", name: "Старт", price: "990", clients: "до 10 клиентов", popular: false },
  { id: "pro", name: "Практик", price: "2 490", clients: "до 50 клиентов", popular: true },
  { id: "expert", name: "Студия", price: "4 990", clients: "до 100 клиентов", popular: false },
];

const AUDIENCE = [
  {
    icon: Dumbbell,
    title: "Онлайн-тренеру",
    text: "Ведете 10–50 человек удалённо: программы, дневники и отчёты вместо чатов и таблиц.",
  },
  {
    icon: Users,
    title: "Тренеру в зале",
    text: "Очные сессии плюс сопровождение между ними: задачи, привычки и замеры под контролем.",
  },
  {
    icon: ClipboardList,
    title: "Нутрициологу и куратору",
    text: "Анкеты, еженедельные отчёты, материалы по этапам и сигнал, если клиент «пропал».",
  },
];

/** Только кабинет тренера — на странице для тренеров */
const TRAINER_SCREENS = [
  {
    src: "/screens/m-trainer-home.png",
    role: "Тренер",
    title: "Главная",
    text: "Кто в зоне риска и что проверить сегодня",
  },
  {
    src: "/screens/m-trainer-clients.png",
    role: "Тренер",
    title: "Клиенты",
    text: "Воронка от заявки до активного",
  },
  {
    src: "/screens/m-trainer-client.png",
    role: "Тренер",
    title: "Карточка клиента",
    text: "Программа, дневники и статусы в одном месте",
  },
  {
    src: "/screens/m-trainer-analytics.png",
    role: "Тренер",
    title: "Аналитика",
    text: "Веса, тоннаж и динамика по человеку",
  },
  {
    src: "/screens/m-trainer-templates.png",
    role: "Тренер",
    title: "Шаблоны",
    text: "Библиотека программ и быстрый повтор",
  },
];

const FAQ = [
  {
    q: "Как клиент попадает в кабинет?",
    a: "Вы создаёте карточку и отправляете ссылку-приглашение. Человек задаёт пароль и сразу видит тренировки, дневник и отчёты. Самостоятельно зарегистрироваться «мимо тренера» нельзя.",
  },
  {
    q: "Что входит в 14 бесплатных дней?",
    a: "Весь функционал и до 10 клиентов. Карта не нужна — можно просто попробовать.",
  },
  {
    q: "Как платить после пробного периода?",
    a: "Онлайн-оплата подключается. Пока её нет, тариф включаем вручную — напишите нам, это быстро.",
  },
  {
    q: "Клиенту нужно приложение?",
    a: "Нет. Кабинет открывается в браузере телефона по ссылке. Отдельные приложения появятся в магазинах позже.",
  },
  {
    q: "Где хранятся данные?",
    a: "В отдельной базе. К карточке клиента имеет доступ только его тренер. Пароли хранятся в зашифрованном виде.",
  },
  {
    q: "Можно перенести людей из таблиц?",
    a: "Да. Карточки заводятся быстро, а анкету каждый заполняет сам при первом входе — перепечатывать всё не нужно.",
  },
];

const DEMO_ACCOUNTS = [
  {
    role: "Тренер",
    name: "Алексей Тренеров",
    email: "trainer@fitpro.ru",
    password: "password123",
  },
  {
    role: "Клиент",
    name: "Мария Соколова",
    email: "client1@fitpro.ru",
    password: "password123",
  },
];

const STATS = [
  { icon: Zap, label: "Назначить программу", value: "за минуту" },
  { icon: Smartphone, label: "Кабинет клиента", value: "с телефона" },
  { icon: Bell, label: "Кто «пропал»", value: "видно сразу" },
  { icon: ShieldCheck, label: "Роли", value: "тренер и клиент" },
];

function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6 rounded-md" : "h-9 w-9 rounded-xl";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <header className="glass-header sticky top-0 z-40 border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <LogoMark />
            <span className="text-lg font-semibold tracking-tight">Coachly</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
            {[
              { href: "#features", label: "Возможности" },
              { href: "#how", label: "Как это работает" },
              { href: "#app", label: "Экраны" },
              { href: "#pricing", label: "Тарифы" },
              { href: "#demo", label: "Демо" },
              { href: "#faq", label: "Вопросы" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/for-clients"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
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
                14 дней <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — единственный «захват» до финального баннера */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 45% at 90% 0%, hsl(var(--primary) / 0.12), transparent 55%), radial-gradient(ellipse 45% 40% at 0% 20%, hsl(var(--primary) / 0.06), transparent 50%)",
          }}
          aria-hidden
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-24">
          <div className="animate-slide-up text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-surface">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15">
                <Sparkles className="h-3 w-3 text-primary" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-primary">
                Платформа для онлайн-тренеров
              </span>
            </div>

            <h1 className="type-display mx-auto max-w-2xl text-balance lg:mx-0">
              Ведение клиентов{" "}
              <span className="text-primary">без хаоса</span>
              {" "}в чатах и таблицах
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Программы, дневник тренировок, отчёты, прогресс и оплаты — в одном кабинете.
              Вы видите, кто тренируется, а кто пропал. Клиент — свой план с телефона.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/register">
                  14 дней бесплатно <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7 text-base" asChild>
                <a href="#demo">Смотреть демо</a>
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" /> Без привязки карты
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" /> До 10 клиентов на старте
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" /> Работает с телефона
              </span>
            </div>
          </div>

          <div className="relative animate-scale-in [animation-delay:120ms]">
            <DashboardMock />
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

      <section className="relative border-y border-border/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-8 md:grid-cols-4 md:gap-4 md:py-10">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-center shadow-surface transition-colors hover:border-primary/30"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-lg font-semibold tracking-tight sm:text-xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <MktSplit
        id="features"
        eyebrow="Возможности"
        title="Всё, чем вы сейчас ведёте клиентов — в одном кабинете"
        subtitle="Не мессенджер, не Excel и не папка с PDF. Клиенты, программы, дневники, отчёты и оплаты — там, где вы реально работаете."
      >
        <MktFeatureList items={FEATURES} />
      </MktSplit>

      <MktBand>
        <MktSection
          id="how"
          eyebrow="Как это работает"
          title="От первого клиента до понятного прогресса"
          subtitle="Короткий цикл без лишних сервисов. Ниже — то, что происходит на практике."
          narrow
        >
          <MktTimeline steps={STEPS} />
        </MktSection>
      </MktBand>

      <MktSection
        id="app"
        eyebrow="Кабинет тренера"
        title="Экраны, с которых ведёте клиентов"
        subtitle="Реальные кадры с телефона. Нажмите на любой — откроется крупнее."
      >
        <ScreenshotGallery screens={TRAINER_SCREENS} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Кабинет клиента —{" "}
          <Link to="/for-clients#app" className="font-medium text-primary hover:underline">
            на отдельной странице
          </Link>
          . Веб уже открывается с телефона.
        </p>
      </MktSection>

      <MktSection
        id="pricing"
        eyebrow="Тарифы"
        title="Платите за число клиентов"
        subtitle="Набор функций одинаковый на всех тарифах. Меняется только лимит человек в ведении."
      >
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3 sm:items-stretch">
          {PRICING.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-surface transition-colors hover:border-primary/30",
                p.popular
                  ? "z-10 border-primary/40 shadow-panel ring-1 ring-primary/25 sm:scale-[1.02]"
                  : "border-border",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Выбирают чаще
                </span>
              )}
              <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">{p.price}</span>
                <span className="text-sm text-muted-foreground">₽ в месяц</span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.clients}</p>
              <div className="my-5 h-px bg-border" />
              <ul className="flex-1 space-y-2.5 text-sm">
                {[
                  "Клиенты и воронка",
                  "Программы и дневник",
                  "Отчёты и аналитика",
                  "Материалы и оплаты",
                ].map((li) => (
                  <li key={li} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    {li}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-7 w-full"
                variant={p.popular ? "default" : "outline"}
                asChild
              >
                <Link to={`/register?plan=${p.id}`}>
                  14 дней на {p.name}
                  {p.popular && <ArrowRight className="h-4 w-4" />}
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
          На любом тарифе сначала 14 дней бесплатно. Онлайн-оплату подключаем — до этого тариф
          включаем вручную по запросу.
        </p>
      </MktSection>

      <MktBand>
        <MktSection
          eyebrow="Кому подойдёт"
          title="Если ведёте людей, а не только «чат»"
          subtitle="Coachly для тех, у кого клиенты и сопровождение — основная работа, а не хобби в переписке."
        >
          <MktCardGrid cols={3}>
            {AUDIENCE.map((a) => (
              <MktCard key={a.title} icon={a.icon} title={a.title} text={a.text} />
            ))}
          </MktCardGrid>
        </MktSection>
      </MktBand>

      <MktDemoAccess accounts={DEMO_ACCOUNTS} />

      <MktSection id="faq" eyebrow="Вопросы" title="Коротко по делу" narrow>
        <MktFaq items={FAQ} />
      </MktSection>

      <MktCtaBanner
        eyebrow="Попробуйте"
        title="Заведите кабинет и пригласите первого клиента"
        subtitle="Регистрация занимает минуту. 14 дней — полный доступ, карта не нужна."
      >
        <Button size="lg" className="h-12 px-8" asChild>
          <Link to="/register">
            Создать кабинет <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="h-12 px-7" asChild>
          <Link to="/login">Уже есть аккаунт</Link>
        </Button>
      </MktCtaBanner>

      <section className="border-t border-border/60 bg-muted/25">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="flex flex-col items-center gap-6 text-center">
            <div>
              <p className="type-eyebrow mb-2">Приложения</p>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Скоро в магазинах
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Веб-кабинет уже можно открыть с телефона. Отдельные приложения появятся в RuStore,
                App Store и Google Play.
              </p>
            </div>
            <StoreBadges />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="font-semibold text-foreground">Coachly</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/for-clients" className="transition-colors hover:text-foreground">
              Для клиента
            </Link>
            <a href="#demo" className="transition-colors hover:text-foreground">
              Демо
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Тарифы
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Конфиденциальность
            </Link>
          </div>
          <p className="text-xs">© 2026 Coachly · для тренеров и их клиентов</p>
        </div>
      </footer>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="relative mx-auto max-w-lg lg:max-w-none">
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
            <div key={t.title} className="rounded-xl border border-border/50 bg-card/70 p-3">
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
