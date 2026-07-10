import { describe, expect, it } from "vitest";
import { db } from "../db/client.js";
import { authEmailCodes } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { consumeEmailCode, createEmailCode, hourlyLimited } from "./emailCodes.js";

describe("emailCodes", () => {
  it("создание → правильный код принимается один раз", async () => {
    const code = await createEmailCode("a@b.ru", "verify");
    expect(code).toMatch(/^\d{6}$/);

    const first = await consumeEmailCode("a@b.ru", "verify", code);
    expect(first.ok).toBe(true);

    // Повторное использование того же кода — отказ.
    const second = await consumeEmailCode("a@b.ru", "verify", code);
    expect(second.ok).toBe(false);
  });

  it("неверный код увеличивает attempts и не проходит", async () => {
    const code = await createEmailCode("c@d.ru", "reset");
    const bad = await consumeEmailCode("c@d.ru", "reset", "000000");
    expect(bad.ok).toBe(false);

    const [rec] = await db
      .select()
      .from(authEmailCodes)
      .where(eq(authEmailCodes.email, "c@d.ru"));
    expect(rec?.attempts).toBe(1);

    const good = await consumeEmailCode("c@d.ru", "reset", code);
    expect(good.ok).toBe(true);
  });

  it("после 5 неверных попыток код блокируется даже при верном вводе", async () => {
    const code = await createEmailCode("e@f.ru", "verify");
    for (let i = 0; i < 5; i++) {
      await consumeEmailCode("e@f.ru", "verify", "999999");
    }
    const result = await consumeEmailCode("e@f.ru", "verify", code);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/попыток/i);
  });

  it("код не подходит для другого purpose", async () => {
    const code = await createEmailCode("g@h.ru", "verify");
    const result = await consumeEmailCode("g@h.ru", "reset", code);
    expect(result.ok).toBe(false);
  });

  it("hourlyLimited пропускает до лимита и режет сверх", () => {
    expect(hourlyLimited("k1", 2)).toBe(false);
    expect(hourlyLimited("k1", 2)).toBe(false);
    expect(hourlyLimited("k1", 2)).toBe(true);
    expect(hourlyLimited("k2", 2)).toBe(false);
  });
});
