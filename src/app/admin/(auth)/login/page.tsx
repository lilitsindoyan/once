import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminPartial } from "@/server/admin/auth";
import { loginAction, verify2faAction } from "../../actions";
import { AButton, AInput, ALabel, Flash } from "@/components/admin/kit";

export const metadata = { title: "Log in" };

/** ToR 5.1: email + password, then the authenticator code when 2FA is on. */
export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ step?: string; err?: string }> }) {
  const sp = await searchParams;
  const session = await getAdminPartial();
  if (session?.mfa) redirect("/admin");
  const twoFactor = sp.step === "2fa" && session && !session.mfa;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--admin-border)] bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded bg-black px-3 py-2">
            <Image src="/once-logo.svg" alt="ONCE" width={81} height={17} />
          </span>
          <span className="text-sm font-medium text-[var(--admin-mute)]">Admin</span>
        </div>
        <Flash err={sp.err} />
        {twoFactor ? (
          <form action={verify2faAction} className="grid gap-4">
            <ALabel label="Authenticator code">
              <AInput name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus />
            </ALabel>
            <AButton type="submit">Verify</AButton>
          </form>
        ) : (
          <form action={loginAction} className="grid gap-4">
            <ALabel label="Email">
              <AInput name="email" type="email" autoComplete="username" required autoFocus />
            </ALabel>
            <ALabel label="Password">
              <AInput name="password" type="password" autoComplete="current-password" required />
            </ALabel>
            <AButton type="submit">Log in</AButton>
          </form>
        )}
      </div>
    </div>
  );
}
