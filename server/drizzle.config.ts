import { defineConfig } from "drizzle-kit";

// Генерация SQL-миграций не требует живого подключения — нужен только dialect.
// Применяются миграции скриптом src/db/migrate.ts (через активный драйвер: pglite | pg).
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
