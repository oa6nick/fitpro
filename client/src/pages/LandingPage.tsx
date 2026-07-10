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
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">FitPro</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Возможности</a>
            <a href="#how" className="hover:text-foreground">Как это работает</a>
            <a href="#pricing" className="hover:text-foreground">Тарифы</a>
            <a href="#faq" className="hover:text-foreground">Вопросы</a>
          </nav>
          <div className="flex items-center gap-2">
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
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center md:py-28">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" /> Операционная система для онлайн-тренера
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Всё ведение клиентов — <span className="text-primary">в одном месте</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
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

      {/* Преимущества-строка */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {[
            { icon: Zap, label: "Назначение программы", value: "в 1 клик" },
            { icon: Smartphone, label: "Кабинет клиента", value: "с телефона" },
            { icon: Bell, label: "Зона риска", value: "автоматически" },
            { icon: ShieldCheck, label: "Две роли", value: "тренер и клиент" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Всё, что нужно онлайн-тренеру</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Восемь модулей вместо десятка разрозненных инструментов. Чисто, быстро, на русском.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
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
      <section id="how" className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Сквозной сценарий тренер ↔ клиент</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              От заявки до прогресса на графиках — без переключения между сервисами.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-xl border bg-card p-6">
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

      {/* Тарифы */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Простые тарифы</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Платите за объём клиентов. Все функции — в каждом тарифе.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6",
                p.popular && "border-primary shadow-lg ring-1 ring-primary",
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
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Кому подходит FitPro</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {AUDIENCE.map((a) => (
              <div key={a.title} className="rounded-xl border bg-card p-6">
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
          <h2 className="text-3xl font-bold tracking-tight">Частые вопросы</h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border bg-card px-5 py-4 open:shadow-sm"
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
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight">Соберите своё пространство тренера</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Зарегистрируйтесь и пригласите первого клиента за пару минут. 14 дней бесплатно.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">
                Создать аккаунт тренера <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t">
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

/** Декоративный CSS-макет дашборда (без внешних картинок). */
function DashboardMock() {
  return (
    <div className="mx-auto mt-14 max-w-4xl">
      <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-muted-foreground">FitPro · Главная тренера</span>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4 text-left md:grid-cols-5">
          {[
            { label: "Всего", value: "24" },
            { label: "Активные", value: "18" },
            { label: "Заявки", value: "3" },
            { label: "Зона риска", value: "2", danger: true },
            { label: "Заканчивают", value: "1" },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border p-3">
              <p className={cn("text-2xl font-bold", c.danger && "text-red-600")}>{c.value}</p>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
          {["Новые заявки", "Зона риска", "Лучший прогресс"].map((t, i) => (
            <div key={t} className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-semibold">{t}</p>
              {[0, 1].map((r) => (
                <div key={r} className="mb-1.5 flex items-center justify-between">
                  <div className="h-2 w-20 rounded bg-muted" />
                  <div
                    className={cn(
                      "h-2 w-8 rounded",
                      i === 1 ? "bg-red-200" : "bg-primary/30",
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
