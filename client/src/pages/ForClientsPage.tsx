import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Timer,
  Ruler,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

const CLIENT_FEATURES = [
  {
    icon: Dumbbell,
    title: "Программа всегда с собой",
    text: "Тренировки от тренера — в телефоне: упражнения с техникой и видео, суперсеты, равноценные замены. Никаких скриншотов и PDF в переписке.",
  },
  {
    icon: Timer,
    title: "Дневник в два тапа",
    text: "Отмечайте вес, повторы и ощущения прямо между подходами. Таймер отдыха сам подскажет паузу, «отметить все» — когда всё по плану.",
  },
  {
    icon: Ruler,
    title: "Замеры и фото «до/после»",
    text: "Вес, талия, бёдра и рабочие веса — на графиках. Фото прогресса хранятся рядом и видны только вашему тренеру.",
  },
  {
    icon: CheckSquare,
    title: "Привычки недели",
    text: "Шаги, вода, сон — отметки по дням, процент соблюдения считается сам. Видно, что действительно даёт результат.",
  },
  {
    icon: FileText,
    title: "Отчёты без нервов",
    text: "Раз в неделю — короткая форма от тренера вместо длинного сообщения. Статус «проверен» и комментарий приходят в кабинет.",
  },
  {
    icon: BookOpen,
    title: "Материалы по этапам",
    text: "Гайды и разборы от тренера открываются по неделям сопровождения — ровно тогда, когда они вам нужны.",
  },
  {
    icon: Award,
    title: "Стрики и достижения",
    text: "Бейджи за регулярность и серия недель без пропусков — маленькая победа каждую неделю держит мотивацию.",
  },
  {
    icon: Bell,
    title: "Ничего не забудете",
    text: "Напоминания о тренировке, отчёте и продлении — в кабинете и пушем в браузер.",
  },
];

const BENEFITS = [
  {
    icon: MessageCircle,
    title: "Тренер реагирует вовремя",
    text: "Тренер видит ваш дневник и динамику сразу, а не «в конце месяца» — план корректируется, пока это важно.",
  },
  {
    icon: LineChart,
    title: "Прогресс видно глазами",
    text: "Графики весов и замеров показывают результат, даже когда кажется, что «ничего не меняется».",
  },
  {
    icon: Timer,
    title: "2 минуты в день",
    text: "Вся отчётность — отметки по ходу тренировки и короткая форма раз в неделю. Остальное платформа делает сама.",
  },
  {
    icon: Smartphone,
    title: "Ничего не теряется",
    text: "Программа не в скриншотах, замеры не в заметках, оплата не в голове — всё в одном кабинете.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Тренер присылает ссылку",
    text: "Кабинет клиента создаёт ваш тренер — попросите у него ссылку-приглашение.",
  },
  {
    n: "2",
    title: "Придумываете пароль",
    text: "Минута на вход — и анкета, программа и материалы уже на месте.",
  },
  {
    n: "3",
    title: "Тренируетесь и отмечаете",
    text: "Ведёте дневник и сдаёте замеры с телефона — тренер видит прогресс и ведёт вас к цели.",
  },
];

// Скриншоты клиентской части iOS-приложения (client/public/screens/).
const CLIENT_SCREENS = [
  {
    src: "/screens/client-workouts.png",
    title: "Тренировки",
    text: "Назначенные программы со статусами",
  },
  {
    src: "/screens/client-workout-log.png",
    title: "Дневник тренировки",
    text: "Подходы, вес и повторы — прямо в зале",
  },
  {
    src: "/screens/onboarding-diary.png",
    title: "Дневник тренировок",
    text: "Программа от тренера всегда в телефоне",
  },
  {
    src: "/screens/onboarding-progress.png",
    title: "Прогресс на ладони",
    text: "Замеры, фото «до/после» и привычки недели",
  },
  {
    src: "/screens/onboarding-coach.png",
    title: "Тренер всегда рядом",
    text: "Проверка дневников и еженедельные отчёты",
  },
];

// Тизер платных доп-возможностей клиента — пока «скоро», без цен.
const PLUS_FEATURES = [
  {
    icon: LineChart,
    title: "Расширенная аналитика",
    text: "Оценка 1ПМ, тоннаж по неделям и сравнение периодов «до/после».",
  },
  {
    icon: Camera,
    title: "PDF-книга прогресса",
    text: "Красивый отчёт с фото «до/после» и графиками — сохранить или показать.",
  },
  {
    icon: Activity,
    title: "Apple Health и Garmin",
    text: "Шаги и сон подтягиваются сами — привычки отмечаются без рук.",
  },
  {
    icon: Sparkles,
    title: "AI-разбор техники",
    text: "Загрузите видео упражнения — получите разбор, который увидит и тренер.",
  },
  {
    icon: Snowflake,
    title: "Заморозка стрика",
    text: "Отпуск или болезнь не обнулят серию — стрик можно поставить на паузу.",
  },
  {
    icon: Archive,
    title: "Архив после сопровождения",
    text: "Доступ к своей истории тренировок и замеров даже после окончания работы с тренером.",
  },
];

const FAQ = [
  {
    q: "Сколько это стоит для меня?",
    a: "Кабинет клиента бесплатный — платформу оплачивает ваш тренер. Дополнительные возможности FitPro+ появятся позже и будут по желанию.",
  },
  {
    q: "Как получить доступ?",
    a: "Только через тренера: он создаёт вашу карточку и присылает ссылку-приглашение. По ней вы придумываете пароль — и кабинет готов.",
  },
  {
    q: "Нужно ли ставить приложение?",
    a: "Нет — кабинет работает в браузере телефона по ссылке. Нативное iOS-приложение уже в разработке и скоро появится в App Store.",
  },
  {
    q: "Кто видит мои данные и фото?",
    a: "Только ваш тренер. Фото и замеры хранятся в изолированной базе, доступ в кабинет — по защищённой сессии.",
  },
  {
    q: "Мой тренер ещё не в FitPro. Что делать?",
    a: "Покажите ему платформу: у тренера есть 14 дней бесплатного полного доступа. Вам достаточно отправить ссылку на главную страницу.",
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
    <div className="min-h-screen bg-background">
      {/* Навигация */}
      <header className="glass-header sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FitPro</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Что внутри</a>
            <a href="#how" className="transition-colors hover:text-foreground">Как начать</a>
            <a href="#plus" className="transition-colors hover:text-foreground">FitPro+</a>
            <a href="#faq" className="transition-colors hover:text-foreground">Вопросы</a>
            <Link to="/" className="transition-colors hover:text-foreground">Я тренер</Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild>
              <Link to="/login">Войти в кабинет</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
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
            <Smartphone className="h-3 w-3 text-primary" />
            <span className="type-eyebrow">Кабинет клиента FitPro</span>
          </div>
          <h1 className="type-display mx-auto max-w-3xl">
            Ваш тренер — <span className="text-primary">в одном кабинете</span> с вами
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.82] text-muted-foreground">
            Программа, дневник тренировок, замеры, отчёты и материалы — в телефоне,
            а не в переписке. Вы тренируетесь и отмечаете — тренер видит прогресс
            и вовремя корректирует план.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/login">
                Войти по приглашению <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">Я тренер — мне сюда</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Для клиента бесплатно · доступ по ссылке-приглашению от тренера
          </p>
        </div>
      </section>

      {/* Бенефиты-строка */}
      <section className="border-y border-border/60">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="glass-card rounded-panel px-4 py-5">
              <b.icon className="mb-2 h-6 w-6 text-primary" />
              <p className="font-medium">{b.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности клиента */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Что внутри</p>
          <h2 className="type-section-title">Всё для результата — без хаоса</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Восемь инструментов, которые заменяют скриншоты программ, заметки с весами
            и длинные отчёты в мессенджере.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CLIENT_FEATURES.map((f) => (
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

      {/* Скриншоты клиентской части */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <p className="type-eyebrow mb-3">Мобильное приложение</p>
            <h2 className="type-section-title">Кабинет, который приятно открывать</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Живые экраны iOS-приложения. Скоро в App Store — а веб-версия полностью
              работает с телефона уже сейчас.
            </p>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 pb-4">
            <div className="flex snap-x gap-5 md:justify-center md:gap-6">
              {CLIENT_SCREENS.map((s) => (
                <figure key={s.src} className="w-[200px] shrink-0 snap-center sm:w-[210px]">
                  <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-panel">
                    <img
                      src={s.src}
                      alt={`${s.title} — экран приложения FitPro для клиента`}
                      loading="lazy"
                      width={1179}
                      height={2556}
                      className="block w-full"
                    />
                  </div>
                  <figcaption className="mt-3 text-center">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Как начать */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <p className="type-eyebrow mb-3">Как начать</p>
          <h2 className="type-section-title">Три шага до первого дневника</h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
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
      </section>

      {/* FitPro+ — платные доп-возможности (скоро) */}
      <section id="plus" className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <div className="glass-card mx-auto mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="type-eyebrow">FitPro+ · скоро</span>
            </div>
            <h2 className="type-section-title">Больше, чем дневник</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Необязательные платные возможности для тех, кто хочет выжать из данных максимум.
              Базовый кабинет был и останется бесплатным.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLUS_FEATURES.map((f) => (
              <div key={f.title} className="glass-card rounded-panel p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                    скоро
                  </span>
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-10 text-center">
          <p className="type-eyebrow mb-3">FAQ</p>
          <h2 className="type-section-title">Частые вопросы клиентов</h2>
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

      {/* CTA */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center">
          <div>
            <p className="type-eyebrow mb-3">Начните сегодня</p>
            <h2 className="type-section-title max-w-xl">Попросите тренера про FitPro</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Есть ссылка-приглашение — входите и тренируйтесь. Нет — отправьте тренеру
              ссылку на FitPro: у него будет 14 дней бесплатно, а у вас — нормальный кабинет.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/login">
                Войти в кабинет <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">Показать тренеру</Link>
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
