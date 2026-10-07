"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError, useErrorMessage } from "@/lib/client";
import type { ClaimSummary } from "@/server/claim";
import {
  Display,
  Eyebrow,
  Field,
  IdentityChoice,
  InfoPanel,
  Lead,
  Notice,
  PrimaryButton,
  PrimaryLink,
  Stepper,
  TextInput,
  TextLink,
} from "@/components/portal/kit";

type Step = "enter" | "identify" | "verify" | "claim" | "done";
const ORDER: Step[] = ["enter", "identify", "verify", "claim"];

export function ClaimFlow({ loggedIn, pending }: { loggedIn: boolean; pending: ClaimSummary | null }) {
  const t = useTranslations("claim");
  const tc = useTranslations("common");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  // Back from login with a remembered bottle → straight to the claim step.
  const [step, setStep] = useState<Step>(pending ? (loggedIn ? "claim" : "identify") : "enter");
  const [bottle, setBottle] = useState<ClaimSummary | null>(pending);
  const [serial, setSerial] = useState("");
  const [code, setCode] = useState("");
  const [showName, setShowName] = useState(true);
  const [error, setError] = useState<{ text: string; contact?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const steps = [t("steps.enter"), t("steps.identify"), t("steps.verify"), t("steps.claim")];
  const stepIndex = step === "done" ? 4 : ORDER.indexOf(step);

  async function check() {
    setBusy(true);
    setError(null);
    try {
      setBottle(await api<ClaimSummary>("/api/claim/check", { serial, code }));
      setStep("identify");
    } catch (e) {
      setError({ text: errorMessage(e), contact: e instanceof ApiError && e.code === "claim_deactivated" });
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      await api<{ serial: string }>("/api/claim", { showName, locale });
      setStep("done");
      router.refresh();
    } catch (e) {
      setError({ text: errorMessage(e) });
      if (e instanceof ApiError && (e.code === "claim_expired" || e.code === "claim_already_registered")) {
        setBottle(null);
        setStep("enter");
      }
    } finally {
      setBusy(false);
    }
  }

  const details: [string, string][] = bottle
    ? [
        [t("seriesBatch"), `${bottle.series} · ${bottle.batch}`],
        [t("productionDate"), bottle.productionDate ? format.dateTime(new Date(bottle.productionDate), { dateStyle: "medium" }) : "—"],
        [t("status"), step === "done" ? tc("my") : t("statusUnclaimed")],
      ]
    : [];

  const errorBox = error && (
    <Notice>
      {error.text}{" "}
      {error.contact && (
        <a href={process.env.NEXT_PUBLIC_CONTACT_URL ?? "/"} className="underline">
          {tc("contactUs")}
        </a>
      )}
    </Notice>
  );

  return (
    <div className="max-w-[440px] lg:pt-2">
      {step !== "done" && (
        <div className="mb-10 lg:mb-[clamp(16px,4.44vh,40px)]">
          <Stepper steps={steps} current={stepIndex} />
        </div>
      )}

      {step === "enter" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Display upper={false} className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)]">
            {t("title")}
          </Display>
          <Lead className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]">{t("intro")}</Lead>
          <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] grid gap-7 lg:gap-[clamp(11px,3.11vh,28px)]">
            {errorBox}
            <Field label={t("serial")} hint={t("serialHint")}>
              <TextInput
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={serial}
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                className="tracking-[0.2em]"
                autoFocus
              />
            </Field>
            <Field label={t("code")} hint={t("codeHint")}>
              <TextInput
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="tracking-[0.2em]"
              />
            </Field>
            <PrimaryButton type="submit" busy={busy}>
              {t("check")}
            </PrimaryButton>
          </div>
        </form>
      )}

      {bottle && (step === "identify" || step === "verify" || step === "claim" || step === "done") && (
        <>
          {step === "done" ? (
            <>
              <span className="grid size-[54px] place-items-center rounded-full border border-copper">
                <Check className="size-6 text-copper" strokeWidth={1.4} />
              </span>
              <Eyebrow className="mt-7 lg:mt-[clamp(11px,3.11vh,28px)]">{t("steps.claim")}</Eyebrow>
              <Display className="mt-4">{bottle.serial}</Display>
            </>
          ) : (
            <>
              <Eyebrow>{step === "identify" ? t("identifiedEyebrow") : step === "verify" ? t("verifyEyebrow") : t("privacyEyebrow")}</Eyebrow>
              <Display className="mt-4">{step === "verify" ? t("verifyTitle") : step === "claim" ? t("privacyTitle") : bottle.serial}</Display>
            </>
          )}
          {step === "identify" && <Lead className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)]">{t("identifiedText")}</Lead>}
          {step === "verify" && <Lead className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)]">{t("verifyText")}</Lead>}
          {step !== "verify" && (
            <InfoPanel className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]" rows={step === "identify" || step === "done" ? details : [[t("serial"), bottle.serial], ...details.slice(0, 1)]} />
          )}

          <div className="mt-8 lg:mt-[clamp(12px,3.56vh,32px)] grid gap-5 lg:gap-[clamp(8px,2.22vh,20px)]">
            {errorBox}

            {step === "identify" && (
              <>
                <PrimaryButton onClick={() => setStep(loggedIn ? "claim" : "verify")}>{t("claimThis")}</PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    setBottle(null);
                    setStep("enter");
                  }}
                  className="text-[12px] text-cream underline-offset-4 hover:underline"
                >
                  {t("notThis")}
                </button>
              </>
            )}

            {step === "verify" && <PrimaryLink href={{ pathname: "/login", query: { next: "/claim" } }}>{t("verifyCta")}</PrimaryLink>}

            {step === "claim" && (
              <>
                <IdentityChoice
                  value={showName}
                  onChange={setShowName}
                  labels={{ show: t("showName"), showHint: t("showNameHint"), anon: t("anonymous"), anonHint: t("anonymousHint") }}
                />
                <PrimaryButton onClick={claim} busy={busy}>
                  {t("cta")}
                </PrimaryButton>
              </>
            )}

            {step === "done" && (
              <>
                <PrimaryLink href="/my-bottles">{tc("myBottles")}</PrimaryLink>
                <div className="text-center">
                  <TextLink href={`/my-bottles/${bottle.serial}`}>{tc("viewPassport")}</TextLink>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
