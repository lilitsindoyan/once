"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, useErrorMessage } from "@/lib/client";
import {
  Display,
  Eyebrow,
  IdentityChoice,
  InfoPanel,
  Lead,
  Notice,
  OutlineButton,
  PrimaryButton,
  PrimaryLink,
  TextLink,
} from "@/components/portal/kit";

type Bottle = { serial: string; seriesBatch: string; productionDate: string; from: string; transferredOn: string };

export function AcceptFlow({
  acceptUrl,
  returnPath,
  bottle,
  loggedInEmail,
  wrongAccount,
  invitedEmailMasked,
  invitedEmail,
  siteUrl,
}: {
  /** API endpoint that accepts: by email-link token, or by transfer id from the Transfers page. */
  acceptUrl: string;
  /** Where login sends the person back to. */
  returnPath: string;
  bottle: Bottle;
  loggedInEmail: string | null;
  wrongAccount: boolean;
  invitedEmailMasked: string;
  /** Only passed when nobody else is logged in, to pre-fill the login form. */
  invitedEmail: string | null;
  siteUrl: string;
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
  const [done, setDone] = useState(false);
  const [choosing, setChoosing] = useState(false);

  const next = returnPath;
  const rows: [string, string][] = [
    [t("seriesBatch"), bottle.seriesBatch],
    [t("productionDate"), bottle.productionDate],
    [t("from"), bottle.from],
    [t("transferredOn"), bottle.transferredOn],
  ];

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await api(acceptUrl, { showName, locale });
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="max-w-[440px] lg:pt-2">
        <span className="grid size-[54px] place-items-center rounded-full border border-copper">
          <Check className="size-6 text-copper" strokeWidth={1.4} />
        </span>
        <Eyebrow className="mt-7 lg:mt-[clamp(11px,3.11vh,28px)]">{t("doneEyebrow")}</Eyebrow>
        <Display className="mt-4">{t("doneTitle")}</Display>
        <Lead className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)]">{t("doneText")}</Lead>
        <InfoPanel className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]" rows={[[t("bottleNumber"), bottle.serial], ...rows]} />
        <PrimaryLink href="/my-bottles" className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]">
          {t("viewAll")}
        </PrimaryLink>
        <div className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)] text-center">
          <TextLink href={`/my-bottles/${bottle.serial}`}>{t("viewPassport")}</TextLink>
        </div>
      </div>
    );

  // Step 2: how the recipient appears, then accept (the design's "Your ownership details" screen).
  if (choosing)
    return (
      <div className="max-w-[440px] lg:pt-2">
        <Eyebrow>{bottle.serial}</Eyebrow>
        <Display className="mt-4">{t("privacyTitle")}</Display>
        <p className="mt-4 text-[12px] text-mute">{t("loggedInAs", { email: loggedInEmail ?? "" })}</p>
        <div className="mt-4">
          <IdentityChoice
            value={showName}
            onChange={setShowName}
            labels={{ show: tClaim("showName"), showHint: tClaim("showNameHint"), anon: tClaim("anonymous"), anonHint: tClaim("anonymousHint") }}
          />
        </div>
        <div className="mt-6 grid gap-4 lg:mt-[clamp(10px,2.6vh,24px)] lg:gap-[clamp(8px,1.8vh,16px)]">
          {error && <Notice>{error}</Notice>}
          <PrimaryButton onClick={accept} busy={busy}>
            {t("cta")}
          </PrimaryButton>
          <OutlineButton onClick={() => setChoosing(false)} disabled={busy}>
            {tc("back")}
          </OutlineButton>
        </div>
      </div>
    );

  // Step 1: review the bottle.
  return (
    <div className="max-w-[440px] lg:pt-2">
      <Display>{t("title")}</Display>
      <p className="mt-4 font-display text-[22px] tracking-[0.04em] text-copper lg:mt-[clamp(6px,1.6vh,16px)]">{bottle.serial}</p>
      <Lead className="mt-4 lg:mt-[clamp(6px,1.6vh,16px)]">{t("intro")}</Lead>
      <InfoPanel className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]" rows={rows} />

      <div className="mt-8 lg:mt-[clamp(12px,3.56vh,32px)] grid gap-5 lg:gap-[clamp(8px,2.22vh,20px)]">
        {error && <Notice>{error}</Notice>}

        {!loggedInEmail && (
          <>
            <Lead>{t("loginFirst", { email: invitedEmailMasked })}</Lead>
            <PrimaryLink href={{ pathname: "/login", query: { next, email: invitedEmail ?? "" } }}>{tc("login")}</PrimaryLink>
          </>
        )}

        {wrongAccount && (
          <>
            <Notice>{te("link_wrong_email", { email: invitedEmailMasked })}</Notice>
            <OutlineButton
              onClick={async () => {
                await api("/api/auth/logout", {});
                router.replace({ pathname: "/login", query: { next } });
                router.refresh();
              }}
            >
              {t("switchAccount")}
            </OutlineButton>
          </>
        )}

        {loggedInEmail && !wrongAccount && <PrimaryButton onClick={() => setChoosing(true)}>{t("cta")}</PrimaryButton>}
      </div>

      <a href={siteUrl} className="mt-8 lg:mt-[clamp(12px,3.56vh,32px)] flex items-center justify-center gap-3 text-[12px] text-cream hover:text-white">
        {tc("learnMore")}
        <ArrowRight className="size-3.5" strokeWidth={1.5} />
      </a>
    </div>
  );
}
