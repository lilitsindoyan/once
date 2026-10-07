"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, useErrorMessage } from "@/lib/client";
import { Alert, Button, Card, Field, Input, linkButton, PrivacyChoice } from "@/components/ui";

type Step = "privacy" | "email" | "check" | "sent" | "closed";

const norm = (s: string) => s.trim().toLowerCase();

export function TransferFlow({ serial, initialShowName, ownEmail }: { serial: string; initialShowName: boolean; ownEmail: string }) {
  const t = useTranslations("transfer");
  const tc = useTranslations("common");
  const tClaim = useTranslations("claim");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  const [step, setStep] = useState<Step>("privacy");
  const [showName, setShowName] = useState(initialShowName);
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const steps: Step[] = ["privacy", "email", "check"];
  const stepIndex = steps.indexOf(step);

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
      const res = await api<{ accountClosed: boolean }>(`/api/me/bottles/${serial}/transfer`, {
        showName,
        email,
        emailConfirm,
        locale,
      });
      setStep(res.accountClosed ? "closed" : "sent");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      {stepIndex >= 0 && (
        <ol className="mb-8 flex gap-2" aria-label={t("title")}>
          {[t("stepPrivacy"), t("stepEmail"), t("stepCheck")].map((label, i) => (
            <li key={label} className="flex-1">
              <span className={`block h-0.5 ${i <= stepIndex ? "bg-copper" : "bg-line"}`} />
              <span className={`mt-2 block text-xs ${i === stepIndex ? "text-cream" : "text-mute"}`}>
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {step === "privacy" && (
        <div className="grid gap-6">
          <p className="text-cream">{t("privacyIntro")}</p>
          <PrivacyChoice
            value={showName}
            onChange={setShowName}
            labels={{
              show: tClaim("showName"),
              showHint: tClaim("showNameHint"),
              anon: tClaim("anonymous"),
              anonHint: tClaim("anonymousHint"),
            }}
          />
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setStep("email")}>{t("next")}</Button>
            <Link href={`/my-bottles/${serial}`} className="inline-flex items-center text-mute hover:text-cream">
              {tc("cancel")}
            </Link>
          </div>
        </div>
      )}

      {step === "email" && (
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            toCheck();
          }}
        >
          <Field label={t("email")}>
            <Input type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Field label={t("emailConfirm")}>
            <Input
              type="email"
              required
              autoComplete="off"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              onPaste={(e) => e.preventDefault()}
            />
          </Field>
          <div className="flex flex-wrap gap-4">
            <Button type="submit">{t("next")}</Button>
            <Button type="button" variant="ghost" onClick={() => setStep("privacy")}>
              {tc("back")}
            </Button>
          </div>
        </form>
      )}

      {step === "check" && (
        <div className="grid gap-6">
          <p className="font-display text-2xl break-all text-white sm:text-4xl">{norm(email)}</p>
          <Alert tone="info">{t("warning")}</Alert>
          <div className="flex flex-wrap gap-4">
            <Button onClick={confirm} busy={busy}>
              {t("confirm")}
            </Button>
            <Button variant="ghost" onClick={() => setStep("email")} disabled={busy}>
              {t("editEmail")}
            </Button>
          </div>
        </div>
      )}

      {step === "sent" && (
        <div className="grid gap-6">
          <h2 className="font-display text-3xl text-cream">{t("sentTitle")}</h2>
          <p className="text-cream">{t("sentText", { email: norm(email) })}</p>
          <Link href="/my-bottles" className={linkButton}>
            {t("backToBottles")}
          </Link>
        </div>
      )}

      {step === "closed" && (
        <div className="grid gap-6">
          <h2 className="font-display text-3xl text-cream">{t("closedTitle")}</h2>
          <p className="text-cream">{t("sentText", { email: norm(email) })}</p>
          <p className="text-mute">{t("closedText")}</p>
          <Link href="/claim" className={linkButton}>
            {t("home")}
          </Link>
        </div>
      )}
    </Card>
  );
}
