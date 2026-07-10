import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll } from "vitest";
import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "../db/client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Каждый тест-файл получает свежую in-memory БД (vitest-воркеры изолированы),
// поэтому миграции применяем один раз на файл.
beforeAll(async () => {
  await migrate(db as never, {
    migrationsFolder: path.resolve(__dirname, "../../drizzle"),
  });
});
