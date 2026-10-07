/* eslint-disable @next/next/no-img-element -- data: URL QR code */
import { pageAdmin } from "@/server/admin/page";
import { start2faSetup } from "@/server/admin/auth";
import { confirm2faAction } from "../../actions";
import { AButton, AInput, ALabel, Flash, PageHeader, Panel } from "@/components/admin/kit";

export const metadata = { title: "My account" };

/** ToR 5.1 — two-factor authentication with an authenticator app. */
export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const admin = await pageAdmin();
  const sp = await searchParams;
  // A fresh secret is generated each time the page opens until 2FA is confirmed.
  const setup = admin.totpEnabled ? null : await start2faSetup(admin);

  return (
    <>
      <PageHeader title="My account" sub={`${admin.name} · ${admin.email} · ${admin.role.replace("_", " ").toLowerCase()}`} />
      <Flash ok={sp.ok} err={sp.err} />
      <Panel title="Two-factor authentication" className="max-w-xl">
        {admin.totpEnabled ? (
          <p className="text-sm">On. You&apos;ll be asked for a code from your authenticator app at every login.</p>
        ) : (
          setup && (
            <div className="grid gap-4">
              <p className="text-sm">
                Scan this code with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code to turn
                two-factor authentication on.
              </p>
              <img src={setup.qr} alt="QR code for the authenticator app" width={200} height={200} className="rounded border" />
              <p className="text-xs text-[var(--admin-mute)]">
                Can&apos;t scan? Enter this key: <code className="break-all">{setup.secret}</code>
              </p>
              <form action={confirm2faAction} className="flex flex-wrap items-end gap-2">
                <ALabel label="Code">
                  <AInput name="code" inputMode="numeric" maxLength={6} required className="w-32" />
                </ALabel>
                <AButton type="submit">Turn on</AButton>
              </form>
            </div>
          )
        )}
      </Panel>
    </>
  );
}
