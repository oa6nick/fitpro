/**
 * Снимает только мобильные экраны (390×844) для галереи лендинга.
 * Источник: прод https://fitpro.oasixlab.com
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "client", "public", "screens");
fs.mkdirSync(OUT, { recursive: true });

const base = process.env.FITPRO_URL || "https://fitpro.oasixlab.com";

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  console.log("saved", name, fs.statSync(file).size);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: "light",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await context.newPage();

async function login(email, password, expectPath) {
  await context.clearCookies();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${expectPath}`, { timeout: 25000 });
  await page.waitForTimeout(1000);
}

try {
  // --- Trainer mobile ---
  await login("trainer@fitpro.ru", "password123", "/t");
  await shot(page, "m-trainer-home.png");

  await page.goto(base + "/t/clients", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "m-trainer-clients.png");

  // На мобилке таблица скрыта — кликаем видимую карточку списка
  const clientLink = page.locator('ul a[href*="/t/clients/"], .md\\:hidden a[href*="/t/clients/"]').first();
  const anyClient = page.locator('a[href*="/t/clients/"]:visible').first();
  const link = (await anyClient.count()) > 0 ? anyClient : clientLink;
  if ((await link.count()) > 0) {
    await link.click({ force: true });
    await page.waitForTimeout(1200);
    await shot(page, "m-trainer-client.png");
  } else {
    // fallback: прямой URL из href скрытой ссылки
    const href = await page.locator('a[href*="/t/clients/"]').first().getAttribute("href");
    if (href) {
      await page.goto(base + href, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await shot(page, "m-trainer-client.png");
    }
  }

  await page.goto(base + "/t/analytics", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const trigger = page.locator('[aria-label="Выбор клиента"]');
  if ((await trigger.count()) > 0) {
    await trigger.click();
    await page.waitForTimeout(400);
    const opt = page.locator('[role="option"]').first();
    if ((await opt.count()) > 0) {
      await opt.click();
      await page.waitForTimeout(1400);
    }
  }
  await shot(page, "m-trainer-analytics.png");

  await page.goto(base + "/t/templates", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "m-trainer-templates.png");

  // --- Client mobile ---
  await login("client1@fitpro.ru", "password123", "/c");
  await shot(page, "m-client-home.png");

  await page.goto(base + "/c/workouts", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "m-client-workouts.png");

  const w = page.locator('a[href*="/c/workouts/"]').first();
  if ((await w.count()) > 0) {
    await w.click();
    await page.waitForTimeout(1400);
    await shot(page, "m-client-diary.png");
  }

  await page.goto(base + "/c/progress", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, "m-client-progress.png");

  await page.goto(base + "/c/tasks", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "m-client-habits.png");

  console.log("OK mobile screens");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
