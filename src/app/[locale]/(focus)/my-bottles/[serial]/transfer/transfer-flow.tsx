"use client";

import { useState } from "react";
import { Clock3, Mail } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, useErrorMessage } from "@/lib/client";
import {
  Display,
  Eyebrow,
  Field,
  IdentityChoice,
  InfoPanel,
  Lead,
  Notice,
  OutlineButton,
  PrimaryButton,
  PrimaryLink,
  TextInput,
} from "@/components/portal/kit";

type Step = "privacy" | "email" | "check" | "sent" | "closed";

const norm = (s: string) => s.trim().toLowerCase();

export function TransferFlow({ serial, initialShowName, ownEmail }: { serial: string; initialShowName: boolean; ownEmail: string }) {
  const t = useTranslations("transfer");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  const [step, setStep] = useState<Step>("privacy");
  const [showName, setShowName] = useState(initialShowName);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [sentAt, setSentAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toCheck() {
    setError(null);
    if (norm(email) !== norm(emailConfirm)) return setError(te("transfer_email_mismatch"));
    if (norm(email) === norm(ownEmail)) return setError(te("transfer_own_email"));
    setStep("check");
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ accountClosed: boolean }>(`/api/me/bottles/${serial}/transfer`, { showName, email, emailConfirm, locale });
      setSentAt(new Date());
      setStep(res.accountClosed ? "closed" : "sent");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const errorBox = error && <Notice>{error}</Notice>;
  const wrap = "max-w-[400px] lg:pt-6";

  if (step === "privacy")
    return (
      <div className={wrap}>
        <Eyebrow className="leading-[1.7]">{t("privacyEyebrow")}</Eyebrow>
        <Display className="mt-4">{t("title")}</Display>
        <Lead className="mt-6">{t("privacyIntro")}</Lead>
        <div className="mt-8">
          <IdentityChoice
            value={showName}
            onChange={setShowName}
            labels={{ show: t("showName"), showHint: t("showNameHint"), anon: t("anonymous"), anonHint: t("anonymousHint") }}
          />
        </div>
        <PrimaryButton className="mt-6" onClick={() => setStep("email")}>
          {t("continue")}
        </PrimaryButton>
      </div>
    );

  if (step === "email")
    return (
      <form
        className={wrap}
        onSubmit={(e) => {
          e.preventDefault();
          toCheck();
        }}
      >
        <Eyebrow>{t("emailEyebrow")}</Eyebrow>
        <Display className="mt-4">{t("emailTitle")}</Display>
        <Lead className="mt-6">{t("emailIntro")}</Lead>
        <div className="mt-10 grid gap-7">
          {errorBox}
          <Field label={t("email")}>
            <TextInput type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label={t("emailConfirm")}>
            <TextInput
              type="email"
              required
              autoComplete="off"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              onPaste={(e) => e.preventDefault()}
            />
          </Field>
          <PrimaryButton type="submit">{t("next")}</PrimaryButton>
          <OutlineButton type="button" onClick={() => setStep("privacy")}>
            {tc("back")}
          </OutlineButton>
        </div>
      </form>
    );

  if (step === "check")
    return (
      <div className={wrap}>
        <Eyebrow>{t("checkEyebrow")}</Eyebrow>
        <Display className="mt-4">{t("checkTitle")}</Display>
        <p className="mt-8 font-display text-[26px] break-all text-white sm:text-[30px]">{norm(email)}</p>
        <div className="mt-8 grid gap-6">
          <Notice tone="info">{t("warning")}</Notice>
          {errorBox}
          <PrimaryButton onClick={confirm} busy={busy}>
            {t("confirm")}
          </PrimaryButton>
          <OutlineButton onClick={() => setStep("email")} disabled={busy}>
            {t("editEmail")}
          </OutlineButton>
        </div>
      </div>
    );

  const closed = step === "closed";
  return (
    <div className={wrap}>
      <Display>{closed ? t("closedTitle") : t("sentTitle")}</Display>
      <Lead className="mt-5">{t("sentText", { email: norm(email) })}</Lead>
      <InfoPanel
        className="mt-6"
        rows={[
          [
            t("method"),
            <span key="m" className="inline-flex items-center gap-3">
              <Mail className="size-4 text-copper" strokeWidth={1.4} />
              {t("methodEmail")}
            </span>,
          ],
          [t("recipient"), <span key="r" className="break-all">{norm(email)}</span>],
          [t("sentOn"), sentAt ? format.dateTime(sentAt, { dateStyle: "medium", timeStyle: "short" }) : "—"],
        ]}
      />
      <div className="mt-10 flex items-center gap-5">
        <span className="grid size-[54px] shrink-0 place-items-center rounded-full border border-copper">
          <Clock3 className="size-6 text-copper" strokeWidth={1.2} />
        </span>
        <div>
          <p className="text-[12px] tracking-[0.04em] text-copper uppercase">{t("awaitingTitle")}</p>
          <p className="mt-1 text-[12px] text-cream-2">{t("awaitingText")}</p>
        </div>
      </div>
      {closed && <p className="mt-8 text-[13px] leading-relaxed text-mute">{t("closedText")}</p>}
      <PrimaryLink href={closed ? "/login" : "/my-bottles"} className="mt-10">
        {closed ? t("home") : t("backToBottles")}
      </PrimaryLink>
    </div>
  );
}
