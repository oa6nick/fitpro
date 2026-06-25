import { fileURLToPath } from "node:url";
import path from "node:path";
import { env } from "../env.js";
import { db } from "./client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

async function main() {
  if (env.dbDriver === "pg") {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db as any, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(db as any, { migrationsFolder });
  }
  console.log(`✅ Миграции применены (драйвер: ${env.dbDriver}, папка: ${migrationsFolder})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Ошибка миграции:", err);
  process.exit(1);
});
