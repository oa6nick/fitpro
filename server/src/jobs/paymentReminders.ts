import { and, eq, isNotNull, isNull, or, lte, gte, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients, payments } from "../db/schema.js";
import { notify } from "../services/notify.js";

/** За сколько дней до конца оплаченного периода предупреждаем. */
export const REMIND_DAYS_BEFORE = 5;

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Напоминания об окончании оплаченного периода.
 * Идемпотентность: payments.remindedAt — второй прогон в тот же период молчит.
 * Сравниваем ДАТЫ (не время): period_end/next_renewal_date — колонки date.
 */
export async function runPaymentReminders(now = new Date()): Promise<number> {
  const today = iso(now);
  const limit = iso(new Date(now.getTime() + REMIND_DAYS_BEFORE * 86400000));

  // Конец периода = period_end, иначе next_renewal_date (легаси-записи).
  const endsAt = sql<string>`coalesce(${payments.periodEnd}, ${payments.nextRenewalDate})`;

  const rows = await db
    .select({
      paymentId: payments.id,
      endsAt,
      clientName: clients.name,
      clientUserId: clients.userId,
      trainerId: clients.trainerId,
      clientId: clients.id,
    })
    .from(payments)
    .innerJoin(clients, eq(payments.clientId, clients.id))
    .where(
      and(
        isNull(payments.remindedAt),
        eq(payments.status, "paid"),
        isNotNull(endsAt),
        gte(endsAt, today),
        lte(endsAt, limit),
        // Архивных клиентов не беспокоим.
        or(eq(clients.funnelStatus, "active"), eq(clients.funnelStatus, "ending")),
      ),
    );

  for (const row of rows) {
    const daysLeft = Math.ceil(
      (new Date(row.endsAt).getTime() - new Date(today).getTime()) / 86400000,
    );
    const when = daysLeft === 0 ? "сегодня" : `через ${daysLeft} дн.`;

    if (row.clientUserId) {
      await notify(
        row.clientUserId,
        `Сопровождение оплачено до ${row.endsAt} — ${when} нужно продлить`,
        "/c",
      );
    }
    await notify(
      row.trainerId,
      `У клиента «${row.clientName}» заканчивается оплата ${row.endsAt} (${when})`,
      `/t/clients/${row.clientId}`,
    );

    await db
      .update(payments)
      .set({ remindedAt: new Date() })
      .where(eq(payments.id, row.paymentId));
  }

  return rows.length;
}

// Запуск как отдельного процесса (systemd-таймер): npm run job:reminders
const isDirectRun = process.argv[1]?.includes("paymentReminders");
if (isDirectRun) {
  runPaymentReminders()
    .then((n) => {
      console.log(`✅ Напоминаний об оплате отправлено: ${n}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Ошибка job:reminders:", err);
      process.exit(1);
    });
}
