import "dotenv/config";

function str(key: string, fallback?: string): string {
  const v = process.env[key];
  if (v === undefined || v === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Не задана переменная окружения: ${key}`);
  }
  return v;
}

function num(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Переменная ${key} должна быть числом`);
  return n;
}

const nodeEnv = str("NODE_ENV", "development");
const isProd = nodeEnv === "production";

function bool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export const env = {
  nodeEnv,
  isProd,
  port: num("PORT", 4000),
  // Хост прослушивания: 0.0.0.0 для деплоя (доступ по IP), 127.0.0.1 локально.
  host: str("HTTP_HOST", isProd ? "0.0.0.0" : "127.0.0.1"),
  jwtSecret: str("JWT_SECRET", isProd ? undefined : "dev-only-change-me"),
  jwtExpiresIn: str("JWT_EXPIRES_IN", "7d"),
  clientOrigin: str("CLIENT_ORIGIN", "http://localhost:5173"),
  // secure-cookie ТОЛЬКО при HTTPS. На голом HTTP по IP должно быть false, иначе
  // браузер не отправляет cookie и логин «слетает». По умолчанию выключено.
  cookieSecure: bool("COOKIE_SECURE", false),
  // Отдавать собранный фронт (client/dist) из Express — single-origin деплой по IP.
  serveClient: bool("SERVE_CLIENT", isProd),
  dbDriver: str("DB_DRIVER", "pglite") as "pglite" | "pg",
  pgliteDataDir: str("PGLITE_DATA_DIR", "./.data/fitpro"),
  databaseUrl: process.env.DATABASE_URL ?? "",
  uploadsDir: str("UPLOADS_DIR", "./uploads"),
};
