import { describe, expect, it } from "vitest";
import { RISK_DAYS, daysUntil, isAtRisk } from "./risk.js";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("isAtRisk", () => {
  it("нет активности вообще → риск", () => {
    expect(isAtRisk(null)).toBe(true);
  });

  it("активность вчера → не риск", () => {
    expect(isAtRisk(daysAgo(1))).toBe(false);
  });

  it(`активность ровно ${RISK_DAYS} дней назад → риск (граница включительно)`, () => {
    expect(isAtRisk(daysAgo(RISK_DAYS))).toBe(true);
  });

  it("активность сильно давно (строкой) → риск", () => {
    expect(isAtRisk(daysAgo(30).toISOString())).toBe(true);
  });
});

describe("daysUntil", () => {
  it("null → null", () => {
    expect(daysUntil(null)).toBeNull();
  });

  it("дата через 5 дней → 5", () => {
    expect(daysUntil(daysAhead(5))).toBe(5);
  });

  it("прошедшая дата → отрицательное значение", () => {
    expect(daysUntil("2020-01-01")).toBeLessThan(0);
  });
});
