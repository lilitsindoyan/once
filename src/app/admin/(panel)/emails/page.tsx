import Link from "next/link";
import clsx from "clsx";
import { EMAIL_KEYS, EMAIL_VARS, type EmailKey } from "@/lib/email-defaults";
import { listEmailTemplates } from "@/server/admin/content";
import { pageAdmin } from "@/server/admin/page";
import { emailTemplateAction } from "../../actions";
import { AButton, AInput, ALabel, ATextarea, Flash, PageHeader, Panel } from "@/components/admin/kit";

export const metadata = { title: "Emails" };

const NAMES: Record<EmailKey, string> = {
  otp: "Login code (OTP)",
  claim: "Claim confirmation",
  transfer_invite: "Transfer invitation",
  transfer_sent: "Transfer sent",
  transfer_completed: "Transfer completed",
  transfer_cancelled: "Transfer cancelled",
};
const LOCALES = [
  ["hy", "Armenian"],
  ["en", "English"],
  ["ru", "Russian"],
] as const;

/** ToR 4.5 / 5.4 — the six emails, in three languages. */
export default async function EmailsAdmin({ searchParams }: { searchParams: Promise<{ key?: string; ok?: string; err?: string }> }) {
  await pageAdmin();
  const sp = await searchParams;
  const key = (EMAIL_KEYS.includes(sp.key as EmailKey) ? sp.key : "otp") as EmailKey;
  const templates = await listEmailTemplates();
  const current = templates.find((t) => t.key === key)!;

  return (
    <>
      <PageHeader title="Email templates" sub="Plain-text emails. Use {{variable}} placeholders." />
      <Flash ok={sp.ok} err={sp.err} />
      <div className="mb-6 flex flex-wrap gap-2">
        {EMAIL_KEYS.map((k) => (
          <Link
            key={k}
            href={`/admin/emails?key=${k}`}
            className={clsx(
              "rounded-md border px-3 py-1.5 text-sm",
              k === key ? "border-[var(--admin-accent)] bg-white font-medium" : "border-[var(--admin-border)] bg-white/60",
            )}
          >
            {NAMES[k]}
          </Link>
        ))}
      </div>
      <p className="mb-4 text-sm text-[var(--admin-mute)]">
        Variables: {EMAIL_VARS[key].map((v) => `{{${v}}}`).join(", ")}
      </p>
      <div className="grid gap-6 xl:grid-cols-3">
        {LOCALES.map(([locale, label]) => {
          const tpl = current.locales[locale];
          return (
            <Panel key={locale} title={`${label}${tpl.custom ? "" : " · default text"}`}>
              <form action={emailTemplateAction} className="grid gap-3">
                <input type="hidden" name="key" value={key} />
                <input type="hidden" name="locale" value={locale} />
                <ALabel label="Subject">
                  <AInput name="subject" defaultValue={tpl.subject} required maxLength={200} />
                </ALabel>
                <ALabel label="Body">
                  <ATextarea name="body" defaultValue={tpl.body} rows={10} required />
                </ALabel>
                <div>
                  <AButton type="submit">Save {label}</AButton>
                </div>
              </form>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
