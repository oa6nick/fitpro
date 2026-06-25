/** Бизнес-правило MVP: клиент в «зоне риска», если 7+ дней без активности. */
export const RISK_DAYS = 7;

export function isAtRisk(lastActivityAt: Date | null | string): boolean {
  if (!lastActivityAt) return true;
  const last = new Date(lastActivityAt).getTime();
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return days >= RISK_DAYS;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}
