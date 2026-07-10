import { defineConfig } from "vitest/config";

// Тестовое окружение: эфемерный in-memory PGlite. Переменные заданы здесь,
// потому что db/client.ts — синглтон и читает env при первом импорте.
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NODE_ENV: "test",
      DB_DRIVER: "pglite",
      PGLITE_DATA_DIR: "memory://",
      JWT_SECRET: "test-secret",
      EMAIL_PROVIDER: "off",
      COOKIE_SECURE: "false",
    },
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
