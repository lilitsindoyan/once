"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, useErrorMessage } from "@/lib/client";
import { Alert, Button, linkButton, PrivacyChoice } from "@/components/ui";

export function AcceptFlow({
  token,
  loggedInEmail,
  wrongAccount,
  invitedEmailMasked,
  invitedEmail,
}: {
  token: string;
  loggedInEmail: string | null;
  wrongAccount: boolean;
  invitedEmailMasked: string;
  /** Only passed when nobody else is logged in, to pre-fill the login form. */
  invitedEmail: string | null;
}) {
  const t = useTranslations("accept");
  const tc = useTranslations("common");
  const tClaim = useTranslations("claim");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [showName, setShowName] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = `/accept/${token}`;

  if (!loggedInEmail) {
    return (
      <div className="grid gap-6">
        <p className="text-cream">{t("loginFirst", { email: invitedEmailMasked })}</p>
        <Link href={{ pathname: "/login", query: { next, email: invitedEmail ?? "" } }} className={linkButton}>
          {tc("login")}
        </Link>
      </div>
    );
  }

  if (wrongAccount) {
    return (
      <div className="grid gap-6">
        <Alert>{te("link_wrong_email", { email: invitedEmailMasked })}</Alert>
        <Button
          onClick={async () => {
            await api("/api/auth/logout", {});
            router.replace({ pathname: "/login", query: { next } });
            router.refresh();
          }}
        >
          {t("switchAccount")}
        </Button>
      </div>
    );
  }

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ serial: string }>(`/api/transfer/${token}/accept`, { showName, locale });
      router.replace(`/my-bottles/${res.serial}`);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm text-mute">{t("loggedInAs", { email: loggedInEmail })}</p>
      {error && <Alert>{error}</Alert>}
      <h2 className="font-display text-2xl text-cream">{tClaim("privacyTitle")}</h2>
      <PrivacyChoice
        value={showName}
        onChange={setShowName}
        labels={{ show: tClaim("showName"), showHint: tClaim("showNameHint"), anon: tClaim("anonymous"), anonHint: tClaim("anonymousHint") }}
      />
      <Button onClick={accept} busy={busy}>
        {t("cta")}
      </Button>
    </div>
  );
}
