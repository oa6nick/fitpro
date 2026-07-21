import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "client", "public", "screens");
fs.mkdirSync(OUT, { recursive: true });

const shots = [];

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  shots.push(name);
  console.log("saved", name);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const page = await context.newPage();
const base = "http://localhost:5173";

try {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "landing-hero.png");

  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill("#email", "trainer@fitpro.ru");
  await page.fill("#password", "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/t", { timeout: 20000 });
  await page.waitForTimeout(1400);
  await shot(page, "trainer-dashboard.png");

  await page.goto(base + "/t/clients", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "trainer-clients.png");

  const clientLink = page.locator('a[href*="/t/clients/"]').first();
  if ((await clientLink.count()) > 0) {
    await clientLink.click();
    await page.waitForTimeout(1200);
    await shot(page, "trainer-client-card.png");
  }

  await page.goto(base + "/t/analytics", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const trigger = page.locator('[aria-label="Выбор клиента"]');
  if ((await trigger.count()) > 0) {
    await trigger.click();
    await page.waitForTimeout(400);
    const item = page.locator('[role="option"]').first();
    if ((await item.count()) > 0) {
      await item.click();
      await page.waitForTimeout(1400);
    }
  }
  await shot(page, "trainer-analytics.png");

  await page.goto(base + "/t/templates", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "trainer-studio.png");

  await page.goto(base + "/t/exercises", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "trainer-exercises.png");

  await context.clearCookies();
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  await page.fill("#email", "client1@fitpro.ru");
  await page.fill("#password", "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/c", { timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot(page, "client-home.png");

  await page.goto(base + "/c/workouts", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "client-workouts.png");

  const wLink = page.locator('a[href*="/c/workouts/"]').first();
  if ((await wLink.count()) > 0) {
    await wLink.click();
    await page.waitForTimeout(1400);
    await shot(page, "client-workout-log.png");
  }

  await page.goto(base + "/c/progress", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await shot(page, "client-progress.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/c", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await shot(page, "client-home-mobile.png");

  await page.goto(base + "/c/progress", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "client-progress-mobile.png");

  console.log("DONE", shots.join(","));
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
