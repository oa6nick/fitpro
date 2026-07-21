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
    title: "Программа в телефоне",
    text: "Упражнения с подсказками и видео, суперсеты и замены. Не нужно листать скриншоты в чате.",
    wide: true,
  },
  {
    icon: Timer,
    title: "Дневник между подходами",
    text: "Записали вес и повторы — готово. Есть таймер отдыха и кнопка «отметить всё по плану».",
    wide: false,
  },
  {
    icon: LineChart,
    title: "Видно, что получается",
    text: "Серия недель, тоннаж, рабочие веса и замеры на графиках — даже когда зеркало «врёт».",
    wide: false,
  },
  {
    icon: CheckSquare,
    title: "Привычки на неделю",
    text: "Шаги, вода, сон — отмечаете дни, процент считается сам.",
    wide: false,
  },
  {
    icon: FileText,
    title: "Короткий отчёт тренеру",
    text: "Раз в неделю — простая форма вместо длинного сообщения.",
    wide: false,
  },
  {
    icon: BookOpen,
    title: "Материалы вовремя",
    text: "Гайды открываются по ходу ведения — когда они реально нужны.",
    wide: false,
  },
  {
    icon: Award,
    title: "Серии и награды",
    text: "Недели без пропусков и бейджи за регулярность — приятный стимул не сходить с дистанции.",
    wide: false,
  },
  {
    icon: Bell,
    title: "Напоминания",
    text: "О тренировке, отчёте и продлении — в кабинете, ничего не утонет в ленте.",
    wide: false,
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
    n: "1",
    title: "Получите ссылку от тренера",
    text: "Кабинет создаёт тренер. Попросите у него приглашение — без него войти нельзя.",
    detail: "От тренера",
  },
  {
    n: "2",
    title: "Задайте пароль",
    text: "Откройте ссылку, придумайте пароль. Анкета и программа уже будут на месте.",
    detail: "Минута",
  },
  {
    n: "3",
    title: "Тренируйтесь и отмечайте",
    text: "Ведите дневник и сдавайте замеры с телефона. Тренер видит прогресс и ведёт вас дальше.",
    detail: "В зале",
  },
];

const CLIENT_SCREENS = [
  {
    src: "/screens/m-client-home.png",
    title: "Главная",
    text: "Ближайшая тренировка под рукой",
  },
  {
    src: "/screens/m-client-workouts.png",
    title: "Тренировки",
    text: "Что в плане и что уже сделано",
  },
  {
    src: "/screens/m-client-diary.png",
    title: "Дневник",
    text: "Подходы, таймер, завершение",
  },
  {
    src: "/screens/m-client-progress.png",
    title: "Прогресс",
    text: "Серия, тоннаж и замеры",
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
    a: "Для вас — бесплатно. Платформу оплачивает тренер. Дополнительные опции FitPro+ появятся позже и будут по желанию.",
  },
  {
    q: "Как попасть в кабинет?",
    a: "Только по ссылке от тренера. Открываете приглашение, задаёте пароль — и можно пользоваться.",
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
    q: "Тренер ещё не в FitPro. Что делать?",
    a: "Отправьте ему ссылку fitpro.oasixlab.com — у тренеров есть 14 дней бесплатного доступа.",
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
                <Link to="/login">
                  Войти по ссылке тренера <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <Link to="/">Я тренер</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground md:justify-start">
              {["Для вас бесплатно", "Вход только по приглашению", "Удобно с телефона"].map(
                (t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" />
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
          <h2 className="type-section-title text-balance">Всё нужное для тренировок — под рукой</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Больше не нужно искать программу в чате, веса — в заметках, а отчёт писать длинным
            сообщением.
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
            <p className="type-eyebrow mb-3">Как выглядит</p>
            <h2 className="type-section-title text-balance">Пять экранов — откройте любой крупно</h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              Нажмите на телефон: можно рассмотреть интерфейс без прищуривания.
            </p>
          </div>
          <ScreenshotGallery screens={CLIENT_SCREENS} />
        </div>
      </section>

      {/* Как начать */}
      <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Как начать</p>
          <h2 className="type-section-title text-balance">Три простых шага</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Без самостоятельной регистрации: кабинет открывает тренер.
          </p>
        </div>
        <ol className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-surface">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    {s.detail}
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
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
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-8 shadow-panel sm:p-10 md:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative mb-10 max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold tracking-wide text-primary">
                  FitPro+ · в разработке
                </span>
              </div>
              <h2 className="type-section-title text-balance">Дополнительно — когда захотите больше</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Это необязательные возможности «на вырост». Обычный кабинет останется бесплатным
                для клиента.
              </p>
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PLUS_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-surface transition-colors hover:border-primary/30"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Скоро
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
          <p className="type-eyebrow mb-3">Вопросы</p>
          <h2 className="type-section-title">Коротко и по делу</h2>
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
              <p className="type-eyebrow mb-3">Готовы начать</p>
              <h2 className="type-section-title text-balance">
                Попросите тренера перейти в FitPro
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Если ссылка уже есть — входите. Если нет — отправьте тренеру fitpro.oasixlab.com:
                у него 14 дней бесплатно, у вас — удобный кабинет.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button size="lg" className="h-12 px-8" asChild>
                <Link to="/login">
                  Войти <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-7" asChild>
                <Link to="/">Страница для тренера</Link>
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
