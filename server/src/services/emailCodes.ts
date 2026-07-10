import { createHash, randomInt } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { authEmailCodes } from "../db/schema.js";

/**
 * Одноразовые коды на email (подтверждение адреса, сброс пароля).
 * Перенос логики SkillSpot: хэш кода, TTL 15 минут, максимум 5 попыток,
 * часовой лимит выдачи на ключ (email/IP).
 */

export type CodePurpose = "verify" | "reset";

const EMAIL_CODE_TTL_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const generateCode = () => String(randomInt(100000, 1000000));

export async function createEmailCode(email: string, purpose: CodePurpose): Promise<string> {
  const code = generateCode();
  await db.insert(authEmailCodes).values({
    email: email.toLowerCase(),
    purpose,
    codeHash: sha256(code),
    expiresAt: new Date(Date.now() + EMAIL_CODE_TTL_MS),
  });
  return code;
}

export async function consumeEmailCode(
  email: string,
  purpose: CodePurpose,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const [rec] = await db
    .select()
    .from(authEmailCodes)
    .where(
      and(
        eq(authEmailCodes.email, email.toLowerCase()),
        eq(authEmailCodes.purpose, purpose),
        isNull(authEmailCodes.usedAt),
        gt(authEmailCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(authEmailCodes.createdAt))
    .limit(1);

  if (!rec) return { ok: false, error: "Неверный или устаревший код. Запросите новый." };
  if (rec.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Слишком много попыток. Запросите новый код." };
  }
  if (rec.codeHash !== sha256(String(code))) {
    await db
      .update(authEmailCodes)
      .set({ attempts: sql`${authEmailCodes.attempts} + 1` })
      .where(eq(authEmailCodes.id, rec.id));
    return { ok: false, error: "Неверный код." };
  }
  await db
    .update(authEmailCodes)
    .set({ usedAt: new Date() })
    .where(eq(authEmailCodes.id, rec.id));
  return { ok: true };
}

/** Часовой лимитер выдачи кодов (in-memory; при рестарте сбрасывается — приемлемо). */
const hits = new Map<string, { count: number; windowStart: number }>();

export function hourlyLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.windowStart > 3600_000) {
    hits.set(key, { count: 1, windowStart: now });
    return false;
  }
  rec.count += 1;
  return rec.count > limit;
}
