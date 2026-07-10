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
  // Публичный адрес приложения — для ссылок в письмах (инвайты, welcome).
  publicUrl: str("PUBLIC_URL", isProd ? "http://204.168.243.54" : "http://localhost:5173"),
  // За reverse-proxy (nginx) Express должен доверять первому хопу, иначе
  // rate-limit видит 127.0.0.1, а secure-cookie не работает по X-Forwarded-Proto.
  trustProxy: bool("TRUST_PROXY", isProd),
  // Почта: off — письма не шлются, коды логируются в консоль (dev без ключей).
  emailProvider: str("EMAIL_PROVIDER", "off") as "resend" | "smtp" | "off",
  emailFrom: str("EMAIL_FROM", "FitPro <hello@oasixlab.com>"),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: num("SMTP_PORT", 465),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
};
