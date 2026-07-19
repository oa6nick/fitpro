import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { ZodError } from "zod";
import { env } from "./env.js";
import { db } from "./db/client.js";
import { apiRouter } from "./routes/index.js";
import { HttpError } from "./lib/http.js";
import { requireFileAuth } from "./auth/middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  if (env.trustProxy) app.set("trust proxy", 1);

  app.use(
    helmet({
      // CSP ломает Vite-бандл и inline-стили recharts — включать отдельной задачей.
      contentSecurityPolicy: false,
      // HSTS — только когда весь трафик на HTTPS (после переезда на домен).
      hsts: false,
    }),
  );

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  // Общий лимит на API + строгий на чувствительные auth-операции.
  app.use(
    "/api",
    rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }),
  );
  app.use(
    ["/api/auth/login", "/api/auth/register", "/api/auth/reset", "/api/auth/verify"],
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Слишком много попыток, повторите позже" },
    }),
  );

  // Отдача загруженных файлов ТОЛЬКО авторизованным (requireFileAuth: cookie/bearer/?token).
  // Имена crypto-UUID + заголовки против утечки ссылки: no-referrer, nosniff, dotfiles deny.
  app.use(
    "/uploads",
    requireFileAuth,
    (_req, res, next) => {
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
      next();
    },
    express.static(path.resolve(env.uploadsDir), { index: false, dotfiles: "deny" }),
  );

  app.get("/health", async (_req, res) => {
    try {
      await db.execute(sql`select 1`);
      res.json({ status: "ok", driver: env.dbDriver, ts: new Date().toISOString() });
    } catch (err) {
      console.error("health: БД недоступна:", err);
      res.status(503).json({ status: "error", driver: env.dbDriver, error: "БД недоступна" });
    }
  });

  app.use("/api", apiRouter);

  // 404 для неизвестных API
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Не найдено" });
  });

  // Прод/single-origin: отдаём собранный фронт + SPA-fallback (для деплоя по IP без домена).
  const clientDist = path.resolve(__dirname, "../../client/dist");
  if (env.serveClient && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  // Централизованная обработка ошибок
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction,
    ) => {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Ошибка валидации",
          issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        });
      }
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error("Необработанная ошибка:", err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    },
  );

  return app;
}
