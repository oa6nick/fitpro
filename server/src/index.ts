import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";
import { createApp } from "./app.js";

function ensureDirs() {
  // Каталог PGlite нужен только этому драйверу; при pg релиз может быть read-only.
  const dirs = [env.uploadsDir];
  if (env.dbDriver === "pglite" && !env.pgliteDataDir.startsWith("memory://")) {
    dirs.push(env.pgliteDataDir);
  }
  for (const dir of dirs) {
    const abs = path.resolve(dir);
    if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
  }
}

function main() {
  ensureDirs();
  const app = createApp();
  app.listen(env.port, env.host, () => {
    console.log(
      `🏋️  FitPro server слушает http://${env.host}:${env.port} (БД: ${env.dbDriver}, env: ${env.nodeEnv}, фронт: ${env.serveClient ? "встроен" : "отдельно"})`,
    );
  });
}

main();
