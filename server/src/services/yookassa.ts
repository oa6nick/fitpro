import { randomUUID } from "node:crypto";
import { env } from "../env.js";

/**
 * Тонкий клиент API ЮKassa (без SDK, как resend в email.ts).
 * Доверяем только повторному чтению платежа из API — тело вебхука
 * может прислать кто угодно, поэтому активация идёт по re-fetch.
 */

const API = "https://api.yookassa.ru/v3";

function authHeader(): string {
  return "Basic " + Buffer.from(`${env.yookassaShopId}:${env.yookassaSecretKey}`).toString("base64");
}

export interface YooPayment {
  id: string;
  status: string; // pending | waiting_for_capture | succeeded | canceled
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { confirmation_url?: string };
}

export async function createPayment(params: {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<YooPayment> {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      // Идемпотентность на стороне ЮKassa: повтор запроса не создаст второй платёж.
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: params.amountRub.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: params.returnUrl },
      description: params.description,
      metadata: params.metadata,
    }),
  });
  if (!res.ok) {
    throw new Error(`ЮKassa create payment: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as YooPayment;
}

export async function getPayment(paymentId: string): Promise<YooPayment | null> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) return null;
  return (await res.json()) as YooPayment;
}
