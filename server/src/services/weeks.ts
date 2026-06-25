/** Текущая неделя сопровождения клиента (1-based) от даты старта. */
export function currentSupportWeek(startDate: string | null): number {
  if (!startDate) return 1;
  const start = new Date(startDate).getTime();
  const weeks = Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, weeks + 1);
}

/** Понедельник недели для переданной даты (ISO yyyy-mm-dd). */
export function weekStartOf(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = (d.getUTCDay() + 6) % 7; // 0 = понедельник
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
