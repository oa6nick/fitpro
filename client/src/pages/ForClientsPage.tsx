import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Timer,
  LineChart,
  CheckSquare,
  FileText,
  BookOpen,
  Award,
  Bell,
  ArrowRight,
  Smartphone,
  MessageCircle,
  Sparkles,
  Camera,
  Activity,
  Archive,
  Snowflake,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  MktNote,
  MktCtaBanner,
  MktDemoAccess,
} from "@/components/marketing";

const CLIENT_FEATURES = [
  {
    icon: Dumbbell,
    title: "Программа в телефоне",
    text: "Упражнения с подсказками и видео, суперсеты и замены. Не нужно листать скриншоты в чате.",
  },
  {
    icon: Timer,
    title: "Дневник между подходами",
    text: "Записали вес и повторы — готово. Есть таймер отдыха и кнопка «отметить всё по плану».",
  },
  {
    icon: LineChart,
    title: "Видно, что получается",
    text: "Серия недель, тоннаж, рабочие веса и замеры на графиках — даже когда зеркало «врёт».",
  },
  {
    icon: CheckSquare,
    title: "Привычки на неделю",
    text: "Шаги, вода, сон — отмечаете дни, процент считается сам.",
  },
  {
    icon: FileText,
    title: "Короткий отчёт тренеру",
    text: "Раз в неделю — простая форма вместо длинного сообщения.",
  },
  {
    icon: BookOpen,
    title: "Материалы вовремя",
    text: "Гайды открываются по ходу ведения — когда они реально нужны.",
  },
  {
    icon: Award,
    title: "Серии и награды",
    text: "Недели без пропусков и бейджи за регулярность — приятный стимул не сходить с дистанции.",
  },
  {
    icon: Bell,
    title: "Напоминания",
    text: "О тренировке, отчёте и продлении — в кабинете, ничего не утонет в ленте.",
  },
];

const BENEFITS = [
  {
    icon: MessageCircle,
    title: "Тренер в курсе",
    text: "Дневник виден сразу, а не «в конце месяца» — план правят, пока это важно.",
  },
  {
    icon: LineChart,
    title: "Цифры, а не ощущения",
    text: "Графики показывают движение, даже если кажется, что прогресса нет.",
  },
  {
    icon: Timer,
    title: "Минимум времени",
    text: "Отметки во время тренировки и короткая форма раз в неделю — всё.",
  },
  {
    icon: Smartphone,
    title: "Всё в одном месте",
    text: "Программа, веса, замеры и отчёты — не размазаны по чатам и заметкам.",
  },
];

const STEPS = [
  {
    title: "Тренер присылает ссылку",
    text: "Он создаёт вашу карточку в Coachly и копирует персональную ссылку (или отправляет её на почту). Без этой ссылки зарегистрироваться нельзя.",
    tip: "Приглашение",
  },
  {
    title: "Открываете ссылку и задаёте пароль",
    text: "Указываете email и пароль — открывается ваш кабинет. Анкету можно заполнить сразу: так тренеру проще собрать программу.",
    tip: "Вход",
  },
  {
    title: "Тренер назначает тренировку — вы ведёте дневник",
    text: "Когда программа появится в разделе «Тренировки», открываете её в зале, отмечаете подходы и завершаете. Это и есть первый дневник.",
    tip: "Первая тренировка",
  },
];

/** Только кабинет клиента — на странице для клиентов */
const CLIENT_SCREENS = [
  {
    src: "/screens/m-client-home.png",
    role: "Клиент",
    title: "Главная",
    text: "Ближайшая тренировка под рукой",
  },
  {
    src: "/screens/m-client-workouts.png",
    role: "Клиент",
    title: "Тренировки",
    text: "Что в плане и что уже сделано",
  },
  {
    src: "/screens/m-client-diary.png",
    role: "Клиент",
    title: "Дневник",
    text: "Подходы, таймер, завершение",
  },
  {
    src: "/screens/m-client-progress.png",
    role: "Клиент",
    title: "Прогресс",
    text: "Серия, тоннаж и замеры",
  },
  {
    src: "/screens/m-client-habits.png",
    role: "Клиент",
    title: "Привычки",
    text: "Отметки по дням недели",
  },
];

const PLUS_FEATURES = [
  {
    icon: LineChart,
    title: "Расширенная аналитика",
    text: "Сравнение периодов, тоннаж по неделям и оценка силовых показателей.",
  },
  {
    icon: Camera,
    title: "Красивый отчёт с фото",
    text: "Собрать прогресс в PDF — себе или чтобы показать результат.",
  },
  {
    icon: Activity,
    title: "Связка с часами и Health",
    text: "Шаги и сон подтянутся сами — меньше ручных отметок.",
  },
  {
    icon: Sparkles,
    title: "Разбор техники",
    text: "Загрузите видео — получите комментарии, которые увидит и тренер.",
  },
  {
    icon: Snowflake,
    title: "Пауза серии",
    text: "Отпуск или болезнь не сотрут вашу серию недель.",
  },
  {
    icon: Archive,
    title: "История после ведения",
    text: "Тренировки и замеры останутся доступны, даже когда сопровождение закончится.",
  },
];

const FAQ = [
  {
    q: "Сколько это стоит?",
    a: "Для вас — бесплатно. Платформу оплачивает тренер. Дополнительные опции Coachly+ появятся позже и будут по желанию.",
  },
  {
    q: "Как попасть в кабинет?",
    a: "Только по ссылке от тренера. Открываете приглашение, задаёте пароль — и можно пользоваться. Либо зайдите в демо ниже.",
  },
  {
    q: "Нужно ставить приложение?",
    a: "Не обязательно: всё работает в браузере телефона. Отдельные приложения появятся в магазинах позже.",
  },
  {
    q: "Кто видит мои данные?",
    a: "Только ваш тренер. Фото и замеры не попадают в общий доступ.",
  },
  {
    q: "Тренер ещё не в Coachly. Что делать?",
    a: "Отправьте ему ссылку fitpro.oasixlab.com — у тренеров есть 14 дней бесплатного доступа.",
  },
];

const DEMO_ACCOUNTS = [
  {
    role: "Клиент",
    name: "Мария Соколова",
    email: "client1@fitpro.ru",
    password: "password123",
  },
  {
    role: "Тренер",
    name: "Алексей Тренеров",
    email: "trainer@fitpro.ru",
    password: "password123",
  },
];

export function ForClientsPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Coachly для клиента — тренировки, прогресс и тренер в одном кабинете";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <header className="glass-header sticky top-0 z-40 border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="h-[18px] w-[18px]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Coachly</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
            {[
              { href: "#features", label: "Что внутри" },
              { href: "#app", label: "Экраны" },
              { href: "#how", label: "Как начать" },
              { href: "#demo", label: "Демо" },
              { href: "#plus", label: "Coachly+" },
              { href: "#faq", label: "Вопросы" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              Я тренер
            </Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link to="/login">
                Войти <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% -10%, hsl(var(--primary) / 0.12), transparent 55%), linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.35) 100%)",
          }}
          aria-hidden
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24 lg:gap-14">
          <div className="text-center md:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-surface">
              <Smartphone className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold tracking-wide text-primary">
                Кабинет для клиента
              </span>
            </div>
            <h1 className="type-display mx-auto max-w-xl text-balance md:mx-0">
              Ваш план и прогресс —{" "}
              <span className="text-primary">не в переписке</span>
              {" "}с тренером
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0">
              Программа, дневник, замеры и короткие отчёты — в одном месте на телефоне.
              Вы отмечаете тренировки, тренер видит результат и вовремя корректирует план.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button size="lg" className="h-12 px-8" asChild>
                <a href="#demo">
                  Смотреть демо <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <Link to="/">Я тренер</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground md:justify-start">
              {["Для вас бесплатно", "Вход по приглашению", "Удобно с телефона"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-[min(100%,260px)] md:w-[280px]">
            <div
              className="pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 65%)",
              }}
              aria-hidden
            />
            <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-2 shadow-panel ring-1 ring-black/5 dark:ring-white/5">
              <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-4">
                <div className="h-1.5 w-16 rounded-full bg-foreground/12" />
              </div>
              <img
                src="/screens/m-client-home.png"
                alt="Главная клиента Coachly"
                className="aspect-[9/19.5] w-full rounded-[1.55rem] object-cover object-top"
                width={780}
                height={1688}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <MktCardGrid cols={4}>
            {BENEFITS.map((b) => (
              <MktCard key={b.title} icon={b.icon} title={b.title} text={b.text} />
            ))}
          </MktCardGrid>
        </div>
      </section>

      <MktSplit
        id="features"
        eyebrow="Что внутри"
        title="Всё для тренировок — не в чате с тренером"
        subtitle="Программа, веса, замеры и короткие отчёты живут в кабинете. Вы тренируетесь — тренер видит факты, а не скриншоты."
      >
        <MktFeatureList items={CLIENT_FEATURES} />
      </MktSplit>

      <MktBand>
        <MktSection
          id="app"
          eyebrow="Кабинет клиента"
          title="Экраны, с которых вы тренируетесь"
          subtitle="Реальные кадры с телефона. Нажмите на любой — откроется крупнее."
        >
          <ScreenshotGallery screens={CLIENT_SCREENS} />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Кабинет тренера —{" "}
            <Link to="/#app" className="font-medium text-primary hover:underline">
              на главной странице
            </Link>
            .
          </p>
        </MktSection>
      </MktBand>

      <MktSection
        id="how"
        eyebrow="Как начать"
        title="От ссылки тренера до первой отметки в дневнике"
        subtitle="Сами зарегистрироваться нельзя — кабинет открывает только ваш тренер. Вот что происходит дальше."
        narrow
      >
        <MktTimeline steps={STEPS} />
        <div className="mt-10">
          <MktNote title="Как устроена ссылка-приглашение">
            <p>
              Тренер создаёт вашу карточку и копирует персональную ссылку (или присылает письмом).
              Вы открываете её, указываете email и пароль — появляется кабинет. Дальше тренер
              назначает программу, и вы отмечаете первую тренировку в дневнике. Без ссылки войти
              «с улицы» нельзя — кроме демо-аккаунта ниже.
            </p>
          </MktNote>
        </div>
      </MktSection>

      <MktDemoAccess
        accounts={DEMO_ACCOUNTS}
        subtitle="Зайдите как клиент Мария — увидите программу, дневник и прогресс. Пароль один для обоих аккаунтов."
      />

      <MktSection id="plus" eyebrow="Coachly+" title="Дополнительно — когда захотите больше">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-8 shadow-panel sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mb-8 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold tracking-wide text-primary">
                В разработке
              </span>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              Необязательные возможности «на вырост». Обычный кабинет останется бесплатным для
              клиента.
            </p>
          </div>
          <div className="relative">
            <MktCardGrid cols={3}>
              {PLUS_FEATURES.map((f) => (
                <MktCard key={f.title} icon={f.icon} title={f.title} text={f.text} badge="Скоро" />
              ))}
            </MktCardGrid>
          </div>
        </div>
      </MktSection>

      <MktSection id="faq" eyebrow="Вопросы" title="Коротко и по делу" narrow>
        <MktFaq items={FAQ} />
      </MktSection>

      <MktCtaBanner
        eyebrow="Готовы начать"
        title="Попросите тренера перейти в Coachly"
        subtitle="Если ссылка уже есть — входите. Если нет — отправьте тренеру fitpro.oasixlab.com: у него 14 дней бесплатно, у вас — удобный кабинет."
      >
        <Button size="lg" className="h-12 px-8" asChild>
          <Link to="/login">
            Войти <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="h-12 px-7" asChild>
          <Link to="/">Страница для тренера</Link>
        </Button>
      </MktCtaBanner>

      <section className="border-t border-border/50 bg-muted/25">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center">
          <div>
            <p className="type-eyebrow mb-2">Скачать</p>
            <h2 className="text-xl font-semibold tracking-tight">Coachly в магазинах</h2>
          </div>
          <StoreBadges />
        </div>
      </section>

      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dumbbell className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-foreground">Coachly</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/" className="transition-colors hover:text-foreground">
              Для тренера
            </Link>
            <a href="#demo" className="transition-colors hover:text-foreground">
              Демо
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Конфиденциальность
            </Link>
          </div>
          <p className="text-xs">© 2026 Coachly · для спортсменов и тренеров</p>
        </div>
      </footer>
    </div>
  );
}
