import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll } from "vitest";
import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "../db/client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Тесты не должны зависеть от окружения хоста: деплой-гейт на проде запускает
// vitest при боевом server.env (VAPID-ключи заданы), а push.test ожидает
// «push выключен». env.pushEnabled — ленивый геттер, поэтому чистка здесь работает.
delete process.env.VAPID_PUBLIC_KEY;
delete process.env.VAPID_PRIVATE_KEY;
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

// Каждый тест-файл получает свежую in-memory БД (vitest-воркеры изолированы),
// поэтому миграции применяем один раз на файл.
beforeAll(async () => {
  await migrate(db as never, {
    migrationsFolder: path.resolve(__dirname, "../../drizzle"),
  });
});
