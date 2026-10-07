import { db } from "./db";
import { env } from "./env";
import { DEFAULT_EMAILS, type EmailKey } from "./email-defaults";

/**
 * Sends one of the six transactional emails (ToR 4.5) in the recipient's language.
 * Templates come from the EmailTemplate table (editable in admin) and fall back to
 * the bundled defaults. Placeholders: {{name}} style.
 */
export async function sendEmail(opts: {
  to: string;
  key: EmailKey;
  locale: string;
  vars: Record<string, string>;
}) {
  const locale = ["hy", "en", "ru"].includes(opts.locale) ? opts.locale : "en";
  const stored = await db.emailTemplate.findUnique({ where: { key_locale: { key: opts.key, locale } } });
  const tpl = stored ?? DEFAULT_EMAILS[opts.key][locale as "hy" | "en" | "ru"];
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => opts.vars[k] ?? "");
  const subject = fill(tpl.subject);
  const text = fill(tpl.body);

  if (env.EMAIL_PROVIDER === "console") {
    console.info(`\n[email] to=${opts.to} key=${opts.key} locale=${locale}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": env.POSTMARK_TOKEN ?? "",
    },
    body: JSON.stringify({ From: env.EMAIL_FROM, To: opts.to, Subject: subject, TextBody: text, MessageStream: "outbound" }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
}
