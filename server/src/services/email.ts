import { env } from "../env.js";

/**
 * Отправка почты. Провайдеры:
 *  - resend — REST API api.resend.com (без SDK), домен отправителя должен быть
 *    верифицирован в аккаунте Resend (сейчас hello@oasixlab.com);
 *  - smtp — nodemailer (задел на будущее, свой домен/ящик);
 *  - off — письма не отправляются, содержимое логируется (dev/тесты без ключей).
 *
 * Перенесено из SkillSpot (functions.mjs) и oasixlab (api/contact/route.ts).
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { ok: boolean; error?: string };

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Письмо в дизайне Coachly: зелёный акцент (как primary в Tailwind-теме), карточка, крупный код. */
export function emailHtml(opts: {
  title: string;
  intro: string;
  code?: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const { title, intro, code, ctaText, ctaUrl } = opts;
  return `<!doctype html><html lang="ru"><body style="margin:0;padding:0;background:#f3f5f4;font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f4;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#16a34a;padding:20px 32px;"><span style="color:#ffffff;font-size:20px;font-weight:700;">Coachly</span></td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${title}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${intro}</p>
${code ? `<div style="margin:0 0 16px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;text-align:center;font-size:28px;letter-spacing:8px;font-weight:700;color:#15803d;">${code}</div>
<p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Код действует 15 минут. Если вы его не запрашивали — просто проигнорируйте это письмо.</p>` : ""}
${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">${ctaText || "Открыть Coachly"}</a>` : ""}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #eef2f0;"><p style="margin:0;font-size:12px;color:#9ca3af;">Письмо отправлено автоматически — отвечать на него не нужно.<br>© Coachly</p></td></tr>
</table></td></tr></table></body></html>`;
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`email(resend): ${res.status} ${body.slice(0, 300)}`);
    return { ok: false, error: `resend ${res.status}` };
  }
  return { ok: true };
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  await transport.sendMail({
    from: env.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return { ok: true };
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    switch (env.emailProvider) {
      case "resend":
        if (!env.resendApiKey) return { ok: false, error: "RESEND_API_KEY не задан" };
        return await sendViaResend(input);
      case "smtp":
        if (!env.smtpHost) return { ok: false, error: "SMTP_HOST не задан" };
        return await sendViaSmtp(input);
      case "off":
      default:
        console.log(`email(off) → ${input.to} | ${input.subject}\n${input.text ?? input.html}`);
        return { ok: true };
    }
  } catch (err) {
    console.error("email: ошибка отправки:", err);
    return { ok: false, error: String(err) };
  }
}
