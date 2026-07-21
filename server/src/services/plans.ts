/**
 * Тарифы Coachly — единый источник цифр для лимитов и лендинга.
 * Оплата пока не подключена (позже ЮKassa): активация тарифов ручная,
 * при регистрации тренер получает trial.
 */

export type PlanId = "trial" | "basic" | "pro" | "expert";

export const PLANS: Record<PlanId, { title: string; priceRub: number; clientLimit: number }> = {
  trial: { title: "Пробный период", priceRub: 0, clientLimit: 10 },
  basic: { title: "Старт", priceRub: 990, clientLimit: 10 },
  pro: { title: "Практик", priceRub: 2490, clientLimit: 50 },
  expert: { title: "Студия", priceRub: 4990, clientLimit: 100 },
};

export const TRIAL_DAYS = 14;
