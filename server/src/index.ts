import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";
import { createApp } from "./app.js";

function ensureDirs() {
  for (const dir of [env.uploadsDir, env.pgliteDataDir]) {
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
