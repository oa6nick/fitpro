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
import { cn } from "@/lib/utils";

const CLIENT_FEATURES = [
  {
    icon: Dumbbell,
    title: "Программа всегда с собой",
    text: "Упражнения с техникой и видео, суперсеты и замены — без скриншотов в переписке.",
    wide: true,
  },
  {
    icon: Timer,
    title: "Дневник в два тапа",
    text: "Вес, повторы и ощущения между подходами. Таймер отдыха и «отметить все».",
    wide: false,
  },
  {
    icon: LineChart,
    title: "Прогресс на графиках",
    text: "Тоннаж, оценка 1ПМ, серия недель и замеры — видно, что работает.",
    wide: false,
  },
  {
    icon: CheckSquare,
    title: "Привычки недели",
    text: "Шаги, вода, сон — отметки по дням, % соблюдения считается сам.",
    wide: false,
  },
  {
    icon: FileText,
    title: "Отчёты без нервов",
    text: "Короткая форма раз в неделю вместо длинного сообщения тренеру.",
    wide: false,
  },
  {
    icon: BookOpen,
    title: "Материалы по этапам",
    text: "Гайды открываются по неделям — ровно когда нужны.",
    wide: false,
  },
  {
    icon: Award,
    title: "Стрики и бейджи",
    text: "Серия недель и маленькие победы держат мотивацию.",
    wide: false,
  },
  {
    icon: Bell,
    title: "Ничего не забудете",
    text: "Напоминания о тренировке, отчёте и продлении — в кабинете.",
    wide: false,
  },
];

const BENEFITS = [
  {
    icon: MessageCircle,
    title: "Тренер реагирует вовремя",
    text: "Дневник и динамика видны сразу — план корректируется, пока это важно.",
  },
  {
    icon: LineChart,
    title: "Прогресс видно глазами",
    text: "Графики показывают результат, даже когда кажется, что «ничего не меняется».",
  },
  {
    icon: Timer,
    title: "2 минуты в день",
    text: "Отметки по ходу тренировки и короткая форма раз в неделю.",
  },
  {
    icon: Smartphone,
    title: "Ничего не теряется",
    text: "Программа, замеры и оплата — в одном кабинете, не в чатах.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Тренер присылает ссылку",
    text: "Кабинет создаёт ваш тренер. Попросите у него приглашение.",
    detail: "1 минута",
  },
  {
    n: "2",
    title: "Придумываете пароль",
    text: "Вход по ссылке — и анкета с программой уже на месте.",
    detail: "Без карты",
  },
  {
    n: "3",
    title: "Тренируетесь и отмечаете",
    text: "Дневник и замеры с телефона. Тренер видит прогресс и ведёт к цели.",
    detail: "В зале",
  },
];

const CLIENT_SCREENS = [
  {
    src: "/screens/m-client-home.png",
    title: "Главная",
    text: "Ближайшая тренировка и быстрый доступ",
  },
  {
    src: "/screens/m-client-workouts.png",
    title: "Тренировки",
    text: "План и история со статусами",
  },
  {
    src: "/screens/m-client-diary.png",
    title: "Дневник в зале",
    text: "Крупные подходы, таймер, завершить",
  },
  {
    src: "/screens/m-client-progress.png",
    title: "Прогресс",
    text: "Тоннаж, 1ПМ, серия и замеры",
  },
  {
    src: "/screens/m-client-habits.png",
    title: "Привычки",
    text: "Отметки по дням недели",
  },
];

const PLUS_FEATURES = [
  {
    icon: LineChart,
    title: "Расширенная аналитика",
    text: "1ПМ, тоннаж по неделям и сравнение периодов «до/после».",
  },
  {
    icon: Camera,
    title: "PDF-книга прогресса",
    text: "Отчёт с фото и графиками — сохранить или показать.",
  },
  {
    icon: Activity,
    title: "Apple Health и Garmin",
    text: "Шаги и сон подтягиваются сами.",
  },
  {
    icon: Sparkles,
    title: "AI-разбор техники",
    text: "Видео упражнения → разбор, который видит и тренер.",
  },
  {
    icon: Snowflake,
    title: "Заморозка стрика",
    text: "Отпуск не обнулит серию — стрик на паузу.",
  },
  {
    icon: Archive,
    title: "Архив после сопровождения",
    text: "История тренировок остаётся с вами.",
  },
];

const FAQ = [
  {
    q: "Сколько это стоит для меня?",
    a: "Кабинет клиента бесплатный — платформу оплачивает ваш тренер. FitPro+ появится позже и будет по желанию.",
  },
  {
    q: "Как получить доступ?",
    a: "Только через тренера: ссылка-приглашение → пароль → кабинет готов.",
  },
  {
    q: "Нужно ли ставить приложение?",
    a: "Нет — веб в браузере телефона. Нативные приложения — в RuStore и скоро в App Store / Google Play.",
  },
  {
    q: "Кто видит мои данные и фото?",
    a: "Только ваш тренер. Доступ по защищённой сессии.",
  },
  {
    q: "Мой тренер ещё не в FitPro?",
    a: "Отправьте ему fitpro.oasixlab.com — 14 дней бесплатно для тренера.",
  },
];

export function ForClientsPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = "FitPro для клиента — тренировки, прогресс и тренер в одном кабинете";
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
            <span className="text-lg font-semibold tracking-tight">FitPro</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
            {[
              { href: "#features", label: "Что внутри" },
              { href: "#app", label: "Экраны" },
              { href: "#how", label: "Как начать" },
              { href: "#plus", label: "FitPro+" },
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
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Кабинет клиента
              </span>
            </div>
            <h1 className="type-display mx-auto max-w-xl text-balance md:mx-0">
              Тренируйтесь по плану —{" "}
              <span className="text-primary">без хаоса в чатах</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg md:mx-0">
              Программа, дневник, замеры и отчёты — в телефоне. Вы отмечаете подходы, тренер
              видит прогресс и вовремя правит план.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link to="/login">
                  Войти по приглашению <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <Link to="/">Я тренер</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground md:justify-start">
              {["Для клиента бесплатно", "Доступ по ссылке тренера", "Работает в браузере"].map(
                (t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {t}
                  </li>
                ),
              )}
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
                alt="Главная клиента FitPro"
                className="aspect-[9/19.5] w-full rounded-[1.55rem] object-cover object-top"
                width={780}
                height={1688}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="border-y border-border/60">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-surface transition-colors hover:border-primary/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <p className="font-semibold tracking-tight">{b.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Что внутри</p>
          <h2 className="type-section-title">Всё для результата — без хаоса</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Инструменты, которые заменяют скриншоты программ, заметки с весами и длинные отчёты в
            мессенджере.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CLIENT_FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={cn(
                "group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-surface transition-all hover:border-primary/30 hover:shadow-panel",
                f.wide && "sm:col-span-2 lg:col-span-2",
                i === 0 && "bg-gradient-to-br from-primary/[0.08] via-card to-card",
              )}
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              <div className="mt-4 h-0.5 w-8 rounded-full bg-primary/40 transition-all group-hover:w-12 group-hover:bg-primary" />
            </div>
          ))}
        </div>
      </section>

      {/* Screens + lightbox */}
      <section id="app" className="scroll-mt-20 border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <div className="mb-10 text-center">
            <p className="type-eyebrow mb-3">В телефоне</p>
            <h2 className="type-section-title">Нажмите — откроется крупно</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Пять живых экранов кабинета. Клик по телефону — полноэкранный просмотр.
            </p>
          </div>
          <ScreenshotGallery screens={CLIENT_SCREENS} />
        </div>
      </section>

      {/* Как начать */}
      <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Как начать</p>
          <h2 className="type-section-title">Три шага до первого дневника</h2>
        </div>
        <ol className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-surface">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.detail}
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                {i < STEPS.length - 1 && (
                  <p className="mt-4 hidden text-xs font-medium text-primary md:block">
                    далее →
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 text-center">
          <Button size="lg" asChild>
            <Link to="/login">
              У меня уже есть ссылка <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FitPro+ */}
      <section id="plus" className="scroll-mt-20 border-y border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-24">
          <div className="relative overflow-hidden rounded-hero border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-card p-8 shadow-panel sm:p-10 md:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative mb-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  FitPro+ · скоро
                </span>
              </div>
              <h2 className="type-section-title">Больше, чем дневник</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Необязательные возможности для тех, кто хочет выжать из данных максимум. Базовый
                кабинет был и останется бесплатным.
              </p>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PLUS_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-surface backdrop-blur-sm transition-colors hover:border-primary/30"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      скоро
                    </span>
                  </div>
                  <h3 className="font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 mx-auto max-w-3xl px-4 py-20 md:py-24">
        <div className="mb-10 text-center">
          <p className="type-eyebrow mb-3">FAQ</p>
          <h2 className="type-section-title">Частые вопросы</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-surface open:shadow-panel"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium [&::-webkit-details-marker]:hidden">
                <span className="pr-2">{item.q}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all group-open:rotate-45 group-open:border-primary/30 group-open:bg-primary/10 group-open:text-primary">
                  +
                </span>
              </summary>
              <p className="mt-3 border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 md:pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-hero border border-border bg-card shadow-panel">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 80% at 0% 50%, hsl(var(--primary) / 0.12), transparent 55%)",
            }}
            aria-hidden
          />
          <div className="relative flex flex-col items-start justify-between gap-8 px-6 py-12 sm:px-10 md:flex-row md:items-center md:py-14">
            <div className="max-w-xl">
              <p className="type-eyebrow mb-3">Начните сегодня</p>
              <h2 className="type-section-title">Попросите тренера про FitPro</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Есть ссылка — входите. Нет — отправьте тренеру fitpro.oasixlab.com: 14 дней
                бесплатно ему, нормальный кабинет — вам.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link to="/login">
                  Войти в кабинет <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <Link to="/">Показать тренеру</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 bg-muted/25">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center">
          <div>
            <p className="type-eyebrow mb-2">Скачать</p>
            <h2 className="text-xl font-semibold tracking-tight">FitPro в магазинах</h2>
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
            <span className="font-semibold text-foreground">FitPro Platform</span>
          </div>
          <p className="text-xs">© 2026 FitPro · для спортсменов и тренеров</p>
        </div>
      </footer>
    </div>
  );
}
