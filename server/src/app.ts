import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { env } from "./env.js";
import { apiRouter } from "./routes/index.js";
import { HttpError } from "./lib/http.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  // Отдача загруженных файлов
  app.use("/uploads", express.static(path.resolve(env.uploadsDir)));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", driver: env.dbDriver, ts: new Date().toISOString() });
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
