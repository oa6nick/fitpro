import { createRequire } from "node:module";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { env } from "../env.js";
import * as schema from "./schema.js";

const require = createRequire(import.meta.url);

// Оба драйвера (pglite|node-postgres) дают идентичный query-API над одной схемой.
// Типизируем единым конкретным типом, чтобы сохранить вывод типов в роутах.
export type Db = PgliteDatabase<typeof schema>;

/**
 * Двойной драйвер БД:
 *  - DB_DRIVER=pglite (по умолчанию) — встроенный Postgres в процессе (без Docker/демона),
 *    бережёт ноут; файловое хранилище в PGLITE_DATA_DIR.
 *  - DB_DRIVER=pg — внешний PostgreSQL по DATABASE_URL (Docker/прод).
 *
 * Схема одна (drizzle-orm/pg-core) — диалект postgres в обоих случаях.
 */

function buildPglite() {
  // Ленивая загрузка, чтобы pg-сборка не тащила pglite и наоборот.
  const { PGlite } = require("@electric-sql/pglite");
  const { drizzle } = require("drizzle-orm/pglite");
  // PGlite mkdir не рекурсивный — гарантируем существование каталога заранее.
  const fs = require("node:fs");
  fs.mkdirSync(env.pgliteDataDir, { recursive: true });
  const client = new PGlite(env.pgliteDataDir);
  const db = drizzle(client, { schema });
  return Object.assign(db, { __pgliteClient: client });
}

function buildPg() {
  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  if (!env.databaseUrl) {
    throw new Error("DB_DRIVER=pg требует DATABASE_URL");
  }
  const pool = new Pool({ connectionString: env.databaseUrl, max: 10 });
  const db = drizzle(pool, { schema });
  return Object.assign(db, { __pgPool: pool });
}

let _db: Db | null = null;

export function getDb(): Db {
  if (_db) return _db;
  _db = (env.dbDriver === "pg" ? buildPg() : buildPglite()) as unknown as Db;
  return _db;
}

// Удобный синглтон для импорта в роутах/сервисах.
export const db = getDb();
