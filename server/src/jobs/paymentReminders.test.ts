import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { clients, notifications, payments, users } from "../db/schema.js";
import { hashPassword } from "../auth/password.js";
import { runPaymentReminders } from "./paymentReminders.js";

const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

let trainerId: string;
let clientUserId: string;
let clientId: string;

beforeAll(async () => {
  const pass = await hashPassword("secret1");
  const [trainer] = await db
    .insert(users)
    .values({ email: "rem-trainer@test.ru", passwordHash: pass, role: "trainer", name: "Т" })
    .returning();
  trainerId = trainer!.id;

  const [clientUser] = await db
    .insert(users)
    .values({ email: "rem-client@test.ru", passwordHash: pass, role: "client", name: "К" })
    .returning();
  clientUserId = clientUser!.id;

  const [client] = await db
    .insert(clients)
    .values({ trainerId, userId: clientUserId, name: "Плательщик", funnelStatus: "active" })
    .returning();
  clientId = client!.id;
});

describe("напоминания об оплате", () => {
  it("шлёт уведомление клиенту и тренеру за 5 дней до конца периода", async () => {
    const [payment] = await db
      .insert(payments)
      .values({ clientId, amount: 5000, date: iso(-25), periodEnd: iso(3), status: "paid" })
      .returning();

    const sent = await runPaymentReminders();
    expect(sent).toBe(1);

    const clientNotes = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, clientUserId));
    const trainerNotes = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, trainerId));
    expect(clientNotes.length).toBe(1);
    expect(trainerNotes.length).toBe(1);
    expect(clientNotes[0]!.text).toContain("продлить");

    const [after] = await db.select().from(payments).where(eq(payments.id, payment!.id));
    expect(after!.remindedAt).toBeTruthy();
  });

  it("повторный прогон не дублирует уведомления (идемпотентность)", async () => {
    const sent = await runPaymentReminders();
    expect(sent).toBe(0);

    const clientNotes = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, clientUserId));
    expect(clientNotes.length).toBe(1);
  });

  it("оплату с концом периода дальше 5 дней не трогает", async () => {
    await db
      .insert(payments)
      .values({ clientId, amount: 5000, date: iso(-1), periodEnd: iso(20), status: "paid" });
    const sent = await runPaymentReminders();
    expect(sent).toBe(0);
  });

  it("использует next_renewal_date, если period_end не задан (легаси)", async () => {
    const [legacy] = await db
      .insert(payments)
      .values({ clientId, amount: 3000, date: iso(-30), nextRenewalDate: iso(2), status: "paid" })
      .returning();

    const sent = await runPaymentReminders();
    expect(sent).toBe(1);

    const [after] = await db.select().from(payments).where(eq(payments.id, legacy!.id));
    expect(after!.remindedAt).toBeTruthy();
  });

  it("архивных клиентов не беспокоит", async () => {
    const [archived] = await db
      .insert(clients)
      .values({ trainerId, name: "Архивный", funnelStatus: "archived" })
      .returning();
    await db
      .insert(payments)
      .values({ clientId: archived!.id, amount: 1000, date: iso(-30), periodEnd: iso(1), status: "paid" });

    const sent = await runPaymentReminders();
    expect(sent).toBe(0);
  });
});
