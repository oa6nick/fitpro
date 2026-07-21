/**
 * E2E-регрессии интерфейса (node --test + playwright, без @playwright/test).
 *
 * Зачем: typecheck и unit-тесты не видят «вёрстка схлопнулась» — а именно так
 * в дневнике пропало поле веса (клиент не мог записать вес с телефона).
 * Здесь проверяем геометрию, тап-таргеты и критичные сценарии в браузере.
 *
 * Запуск: поднять стек (`npm run dev` в корне), затем `npm run e2e --workspace client`.
 * BASE_URL по умолчанию http://localhost:5173.
 */
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:5173";
const TRAINER = { email: "trainer@fitpro.ru", password: "password123" };
const CLIENT = { email: "client1@fitpro.ru", password: "password123" };
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
/** Минимальный тап-таргет: ниже 36px пальцем в зале уже не попасть. */
const MIN_TAP = 36;

let browser;
/** Сессии логинятся один раз: /api/auth/login ограничен 20 попытками на 15 минут. */
const sessions = {};

async function signIn(user) {
  const ctx = await browser.newContext({ viewport: DESKTOP, locale: "ru-RU" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function openPage(role, url, viewport = DESKTOP) {
  const ctx = await browser.newContext({
    viewport,
    locale: "ru-RU",
    storageState: sessions[role],
  });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  return { ctx, page };
}

/** Путь к первой назначенной тренировке клиента. */
async function firstWorkoutHref(page) {
  await page.goto(`${BASE}/c/workouts`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  return page.evaluate(() => {
    const a = document.querySelector('a[href*="/c/workouts/"]');
    return a?.getAttribute("href") ?? "";
  });
}

before(async () => {
  browser = await chromium.launch();
  sessions.trainer = await signIn(TRAINER);
  sessions.client = await signIn(CLIENT);
});

after(async () => {
  await browser?.close();
});

describe("Дневник тренировки на телефоне", () => {
  test("поля веса и повторов не схлопываются (регрессия: вес нельзя было ввести)", async () => {
    const { ctx, page } = await openPage("client", "/c/workouts", MOBILE);
    const href = await firstWorkoutHref(page);
    assert.ok(href, "у демо-клиента нет назначенной тренировки — проверьте seed");
    await page.goto(BASE + href, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const weight = page.locator('input[aria-label^="Вес, подход"]').first();
    const reps = page.locator('input[aria-label^="Повторы, подход"]').first();
    const wBox = await weight.boundingBox();
    const rBox = await reps.boundingBox();

    assert.ok(wBox && rBox, "поля подхода не найдены");
    assert.ok(wBox.width > 60, `поле веса схлопнулось: ${Math.round(wBox.width)}px`);
    assert.ok(rBox.width > 60, `поле повторов схлопнулось: ${Math.round(rBox.width)}px`);
    // Оба поля равнозначны — перекос больше чем в 1.6 раза означает сломанную сетку.
    const ratio = Math.max(wBox.width, rBox.width) / Math.min(wBox.width, rBox.width);
    assert.ok(ratio < 1.6, `поля разной ширины: ${Math.round(wBox.width)} vs ${Math.round(rBox.width)}`);
    assert.ok(wBox.height >= 40, `поле веса ниже тап-таргета: ${Math.round(wBox.height)}px`);
    await ctx.close();
  });

  test("панель «Завершить» не перекрыта нижней навигацией", async () => {
    const { ctx, page } = await openPage("client", "/c/workouts", MOBILE);
    const href = await firstWorkoutHref(page);
    await page.goto(BASE + href, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const geom = await page.evaluate(() => {
      const box = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      };
      return {
        viewportH: window.innerHeight,
        panel: box(document.querySelector("div.glass-header.fixed")),
        nav: box(document.querySelector("nav.bottom-nav")),
      };
    });
    assert.ok(geom.panel && geom.nav, "не найдены липкая панель или нижняя навигация");
    // Панель должна держаться в пределах экрана: transform у родителя ломает
    // position:fixed и уносит её в конец документа.
    assert.ok(
      geom.panel.top < geom.viewportH,
      `панель не липкая — её верх на ${Math.round(geom.panel.top)}px при высоте экрана ${geom.viewportH}px`,
    );
    assert.ok(
      geom.panel.bottom <= geom.nav.top + 1,
      `панель заходит под таб-бар: низ ${Math.round(geom.panel.bottom)}, верх нава ${Math.round(geom.nav.top)}`,
    );
    await ctx.close();
  });

  test("пресеты таймера отдыха достаточно крупные для пальца", async () => {
    const { ctx, page } = await openPage("client", "/c/workouts", MOBILE);
    const href = await firstWorkoutHref(page);
    await page.goto(BASE + href, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const preset = page.locator('button[aria-label^="Отдых "]').first();
    const box = await preset.boundingBox();
    assert.ok(box, "пресеты таймера не найдены");
    assert.ok(box.height >= MIN_TAP, `пресет ${Math.round(box.height)}px < ${MIN_TAP}px`);
    await ctx.close();
  });

  test("введённый вес сохраняется в дневнике", async () => {
    const { ctx, page } = await openPage("client", "/c/workouts", MOBILE);
    const href = await firstWorkoutHref(page);
    await page.goto(BASE + href, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const weight = page.locator('input[aria-label^="Вес, подход"]').first();
    await weight.fill("62.5");
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(700);

    const restored = await page.locator('input[aria-label^="Вес, подход"]').first().inputValue();
    assert.equal(restored, "62.5", "черновик веса не пережил перезагрузку страницы");
    await ctx.close();
  });
});

describe("Привычки клиента", () => {
  test("семь кнопок дней остаются нажимаемыми на 390px", async () => {
    const { ctx, page } = await openPage("client", "/c/tasks", MOBILE);
    const days = page.locator("button.day-toggle");
    const count = await days.count();
    if (count === 0) {
      await ctx.close();
      return; // у демо-клиента может не быть привычек на текущую неделю
    }
    assert.equal(count % 7, 0, `кнопок дней ${count}, ожидалось кратно семи`);
    for (const i of [0, 3, 6]) {
      const box = await days.nth(i).boundingBox();
      assert.ok(box.width >= MIN_TAP, `день ${i}: ширина ${Math.round(box.width)}px < ${MIN_TAP}px`);
      assert.ok(box.height >= 40, `день ${i}: высота ${Math.round(box.height)}px`);
    }
    await ctx.close();
  });
});

describe("Единая шкала контролов", () => {
  test("кнопка формы совпадает по высоте с полем ввода", async () => {
    const ctx = await browser.newContext({ viewport: DESKTOP, locale: "ru-RU" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    const input = await page.locator('input[type="email"]').boundingBox();
    const submit = await page.locator('button[type="submit"]').boundingBox();
    assert.equal(
      Math.round(input.height),
      Math.round(submit.height),
      `поле ${Math.round(input.height)}px, кнопка ${Math.round(submit.height)}px`,
    );
    await ctx.close();
  });

  test("страницы не разъезжаются по горизонтали на 390px", async () => {
    const pages = ["/", "/for-clients", "/login", "/c", "/c/progress", "/c/tasks"];
    for (const url of pages) {
      const role = url.startsWith("/c") ? "client" : null;
      const ctx = await browser.newContext({
        viewport: MOBILE,
        locale: "ru-RU",
        ...(role ? { storageState: sessions[role] } : {}),
      });
      const page = await ctx.newPage();
      await page.goto(BASE + url, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      assert.ok(overflow <= 1, `${url}: горизонтальный вылет ${overflow}px`);
      await ctx.close();
    }
  });
});

describe("Кабинет тренера", () => {
  test("удаление упражнения спрашивает подтверждение, а не удаляет молча", async () => {
    const { ctx, page } = await openPage("trainer", "/t/exercises");
    const del = page.locator('button[aria-label^="Удалить"]').first();
    if ((await del.count()) === 0) {
      await ctx.close();
      return; // библиотека пуста — нечего удалять
    }
    const before = await page.locator('button[aria-label^="Удалить"]').count();
    await del.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    assert.equal(await dialog.count(), 1, "диалог подтверждения не появился");
    // Закрываем отменой — данные должны остаться на месте.
    await page.getByRole("button", { name: /Отмена/ }).first().click();
    await page.waitForTimeout(400);
    const after = await page.locator('button[aria-label^="Удалить"]').count();
    assert.equal(after, before, "элемент исчез несмотря на отмену");
    await ctx.close();
  });

  test("карточка клиента открывается и показывает имя в заголовке", async () => {
    const { ctx, page } = await openPage("trainer", "/t/clients");
    const link = page.locator('a[href*="/t/clients/"]').first();
    assert.ok((await link.count()) > 0, "нет клиентов — проверьте seed");
    const name = (await link.innerText()).split("\n")[0].trim();
    await link.click();
    await page.waitForTimeout(800);
    const h1 = await page.locator("h1").first().innerText();
    assert.ok(h1.includes(name.split(" ")[0]), `в заголовке «${h1}» нет имени клиента «${name}»`);
    await ctx.close();
  });
});

describe("Состояния и доступность", () => {
  test("ошибка входа объявляется скринридеру", async () => {
    const ctx = await browser.newContext({ viewport: DESKTOP, locale: "ru-RU" });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "nobody@fitpro.ru");
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1200);
    const alert = page.locator('[role="alert"]');
    assert.ok(await alert.count(), "текст ошибки без role=alert — скринридер промолчит");
    await ctx.close();
  });

  test("тёмная тема применяется к документу", async () => {
    const ctx = await browser.newContext({ viewport: DESKTOP, locale: "ru-RU" });
    await ctx.addInitScript(() => localStorage.setItem("fitpro-theme", "dark"));
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "networkidle" });
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    assert.ok(isDark, "класс dark не проставлен");
    await ctx.close();
  });
});
