# CLAUDE.md

Этот файл — гайд для Claude Code (claude.ai/code) при работе с репозиторием **FitPro Platform MVP**.
ВАЖНО: инструкции ниже ПЕРЕОПРЕДЕЛЯЮТ поведение по умолчанию — следуй им буквально.

## Язык общения
**ВСЕГДА отвечай пользователю на русском.** Все объяснения, статусы, вопросы, итоги — по-русски.
**Обращение к пользователю**: его зовут **oa6nick** (не «Макс»/«Максим»; наст. имя Mykyta Belan).

## Обзор проекта

**FitPro Platform** — «операционная система для онлайн-тренера»: SaaS, который заменяет тренеру
Telegram, таблицы, заметки, PDF и платёжные ссылки единым пространством для ведения клиентов.
Цель MVP — **работающее приложение** (не макет): реальная БД, авторизация, две роли (тренер/клиент),
полный CRUD по основным сущностям. Интерфейс полностью на **русском**, дизайн чистый и мобильно-адаптивный.

Сквозной сценарий-критерий готовности: тренер заводит клиента → клиент заполняет анкету →
тренер собирает тренировку и назначает → клиент выполняет и пишет в дневник → клиент сдаёт
замеры/фото/отчёт → тренер видит прогресс на графиках и сводку на главном экране (вкл. авто-метку риска).

**Источник истины — `Replit_Prompt_FitPro_MVP.md` (ТЗ) и `FitPro Platform Presentation.pdf` (концепция).**
Делаем **БЕЗ Replit**, своими силами. Объектное хранилище Replit → локальная папка `uploads/` с отдачей по URL.

## Технический стек

- **Frontend:** React + TypeScript, **Vite**, Tailwind CSS, **shadcn/ui**, React Router, иконки `lucide-react`, графики `recharts`.
- **Backend:** Node.js + **Express** (TypeScript).
- **БД:** PostgreSQL через **Drizzle ORM** (выбран вместо Prisma — см. `knowledge-vault/knowledge/decisions/`).
- **Авторизация:** email + пароль (bcrypt/argon2), сессия = **JWT в httpOnly-cookie**. Роли: `trainer`, `client`.
- **Файлы:** загрузка фото/видео/PDF в локальный `uploads/`, в карточках хранятся URL-ссылки.
- **Seed:** скрипт демо-данных — 1 тренер + 4–5 клиентов с анкетами, программами, отчётами, замерами.

## Планируемая структура (monorepo)

```
FIT PRO MVP/
├── client/                 # React + Vite + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── pages/          # экраны тренера и клиента
│   │   ├── components/     # ui/ (shadcn) + общие
│   │   ├── lib/            # api-клиент, утилиты
│   │   └── routes/         # роутинг + guard по ролям
│   └── ...
├── server/                 # Express + TS
│   ├── src/
│   │   ├── routes/         # REST-эндпоинты
│   │   ├── db/             # схема Drizzle, миграции, client
│   │   ├── auth/           # JWT, cookie, middleware ролей
│   │   ├── services/       # бизнес-логика (риск/проценты/статусы)
│   │   └── seed/           # демо-данные
│   └── ...
├── knowledge-vault/        # → симлинк на Obsidian-vault (в .gitignore)
├── CLAUDE.md
├── Replit_Prompt_FitPro_MVP.md
└── FitPro Platform Presentation.pdf
```

> Код полностью реализован и задеплоен: **https://fitpro.oasixlab.com** (VPS 204.168.243.54,
> systemd `fitpro`, PostgreSQL 16, nginx+TLS). Деплой: `git push server main` (см. DEPLOY.md
> и deploy/README.md). Помимо структуры выше есть `deploy/` (nginx/systemd/бэкапы) и
> `.github/workflows/ci.yml`. Онбординг: тренеры регистрируются сами (trial 14 дней),
> клиенты — по инвайт-ссылке; тарифы — `server/src/services/plans.ts`; почта —
> `server/src/services/email.ts` (resend|smtp|off).

## Команды

```bash
# Frontend (client/)
npm run dev              # vite dev-сервер
npm run build            # vite build
npm run lint             # eslint

# Backend (server/)
npm run dev              # express в watch (tsx)
npm test                 # vitest (in-memory PGlite, интеграционные через supertest)
npm run db:generate      # drizzle-kit generate (миграции из схемы)
npm run db:migrate       # применить миграции
npm run db:studio        # drizzle studio
npm run seed             # демо-данные — ТОЛЬКО локально, деструктивен (clearAll)
```

## Модель данных (кратко)

Полная версия — `knowledge-vault/atlas/Модель данных FitPro.md`. Ядро:

- **User** — id, email, passwordHash, role (`trainer`/`client`), name.
- **Client** — связь тренер↔user-клиента; цель, уровень, формат, датаСтарта, срокСопровождения, **статус воронки**.
- **ClientProfile** — анкета (опыт, травмы, образ жизни, питание, шаги, оборудование, предпочтения).
- **TrainerNote** — заметки тренера по клиенту (несколько с датой).
- **Exercise** — библиотека упражнений тренера (видео, техника, ошибки, мышцы, варианты).
- **WorkoutTemplate** → **Workout** → **WorkoutLog** — шаблон → назначенная тренировка → дневник клиента.
- **Measurement** — замеры (вес/талия/бёдра/грудь/рабочие веса + фото до/после).
- **ReportForm** + **ReportSubmission** — конструктор формы + заполнения со статусом.
- **Task/Habit** — недельные задачи/привычки, % соблюдения.
- **KnowledgeItem** — материалы по категориям с **поэтапным доступом** по неделям.
- **Payment** — оплаты, статус, дата продления.
- **Achievement** — бейджи + streak.

**Воронка статусов клиента:** Новая заявка → Анкета заполнена → Созвон → Ожидает оплату →
Активный → Заморожен → Заканчивает → Архив.

**Авто-логика MVP:** метка «зона риска» при 7+ днях без активности; авто-статусы отчётов
(«пропущен»/«ожидает проверки»); расчёт % соблюдения задач и плана; внутренние уведомления (колокольчик).

## Что НЕ делаем в MVP (заглушки «скоро»)
AI-помощник, реальный эквайринг/автосписание, маркетплейс тренеров, интеграции Apple Health/Garmin/Whoop,
командные роли (куратор/менеджер), белый лейбл. Под них — кнопки/разделы с пометкой «скоро».

## Git-протокол (соло-фаундер, общий `main`)

1. **`git add` ВСЕГДА с explicit pathspec.** Никогда `git add .` / `-A` / `-u`. Только перечислять файлы.
2. **Перед commit — `git status`.** Лишние staged-файлы → STOP, эскалируй oa6nick.
3. **Старт сессии — `git status` + `git log --oneline -5`.**
4. **Push-hold по умолчанию.** Коммитить/пушить только по явной просьбе. На дефолтной ветке — сначала ветка.
5. **Секреты не стейдить:** `.env*` (кроме `.env.example`), JWT-секреты, DB-строки, ключи провайдеров.
   Перед коммитом `.env*` → `git check-ignore -v <file>` + подтверждение.
6. Трейлер коммита заканчивать строкой:
   `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
   Автор: `Mykyta Belan <nickbelan96@gmail.com>`.

## Scope rule
Реализуй ТОЛЬКО явно запрошенное. Не добавляй фичи «на будущее» сверх текущей задачи.
Текущие приоритеты и план дня — в `knowledge-vault/00-home/Текущие приоритеты.md`.

## Obsidian Knowledge Vault

Симлинк (junction) `knowledge-vault/` → `C:\Users\DELL\Projects\PROJECT_VAULTS\fitpro`.
Структура: `00-home/` (карта + приоритеты) · `atlas/` (архитектура, модель данных) ·
`knowledge/{decisions,debugging,patterns,business}/` · `sessions/` · `inbox/`.

Правила заметок: имена файлов = утверждения; wiki-ссылки `[[имя]]`; frontmatter с `tags` и `date`; язык русский.

**После каждого завершённого блока работы (ОБЯЗАТЕЛЬНО):** обнови `00-home/Текущие приоритеты.md`,
заведи заметку (решение → `decisions/`, баг → `debugging/`, паттерн → `patterns/`), веди лог в `sessions/`.

### При старте сессии
Прочитай `knowledge-vault/00-home/index.md` и `Текущие приоритеты.md`.
