import { describe, expect, it } from "vitest";
import { currentSupportWeek, weekStartOf } from "./weeks.js";

const daysAgoIso = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("currentSupportWeek", () => {
  it("нет даты старта → неделя 1", () => {
    expect(currentSupportWeek(null)).toBe(1);
  });

  it("старт сегодня → неделя 1", () => {
    expect(currentSupportWeek(daysAgoIso(0))).toBe(1);
  });

  it("старт 10 дней назад → неделя 2", () => {
    expect(currentSupportWeek(daysAgoIso(10))).toBe(2);
  });

  it("старт в будущем не даёт неделю меньше 1", () => {
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    expect(currentSupportWeek(future)).toBe(1);
  });
});

describe("weekStartOf", () => {
  it("среда → понедельник той же недели", () => {
    expect(weekStartOf("2026-07-08")).toBe("2026-07-06");
  });

  it("понедельник → сам понедельник", () => {
    expect(weekStartOf("2026-07-06")).toBe("2026-07-06");
  });

  it("воскресенье → понедельник прошедшей недели", () => {
    expect(weekStartOf("2026-07-12")).toBe("2026-07-06");
  });
});
