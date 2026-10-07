"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError, useErrorMessage } from "@/lib/client";
import { CodeInput, formatTime } from "@/components/portal/code-input";
import { Display, Divider, Eyebrow, Field, Lead, Notice, PrimaryButton, SelectInput, TextInput } from "@/components/portal/kit";

type Step = "email" | "code" | "profile";

export function LoginFlow({
  next,
  presetEmail,
  verifiedEmail,
  countries,
  siteUrl,
}: {
  next: string;
  presetEmail: string;
  verifiedEmail: string | null;
  countries: { code: string; name: string }[];
  siteUrl: string;
}) {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  // Coming back with an email already confirmed (e.g. reload during registration) → profile step.
  const [step, setStep] = useState<Step>(verifiedEmail ? "profile" : "email");
  const [email, setEmail] = useState(verifiedEmail ?? presetEmail);
  const [code, setCode] = useState("");
  const [profile, setProfile] = useState({ firstName: "", lastName: "", country: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError && e.code === "otp_too_soon") setCooldown(Number(e.details.retryInSeconds ?? 60));
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () =>
    run(async () => {
      await api("/api/auth/otp/request", { email, locale });
      setCode("");
      setStep("code");
      setCooldown(60);
    });

  const verify = () =>
    run(async () => {
      const res = await api<{ status: "logged_in" | "needs_profile" }>("/api/auth/otp/verify", { email, code });
      if (res.status === "logged_in") {
        router.replace(next);
        router.refresh();
      } else setStep("profile");
    });

  const register = () =>
    run(async () => {
      await api("/api/auth/register", { ...profile, locale });
      router.replace(next);
      router.refresh();
    });

  const errorBox = error && <Notice>{error}</Notice>;

  if (step === "email")
    return (
      <form
        className="max-w-[440px] lg:pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendCode();
        }}
      >
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Display upper={false} className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]">
          {t("title")}
        </Display>
        <Lead className="mt-7 lg:mt-[clamp(11px,3.11vh,28px)]">{t("intro")}</Lead>
        <div className="mt-12 lg:mt-[clamp(19px,5.33vh,48px)] grid gap-8 lg:gap-[clamp(12px,3.56vh,32px)]">
          {errorBox}
          <Field label={t("email")}>
            <TextInput type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <PrimaryButton type="submit" busy={busy}>
            {tc("continue")}
          </PrimaryButton>
          <p className="text-center text-xs text-copper-2">{t("helper")}</p>
        </div>
        <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)]">
          <Divider />
          <a href={siteUrl} className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] inline-flex items-center gap-4 text-[12px] text-copper hover:underline">
            <ArrowLeft className="size-4" strokeWidth={1.4} />
            {tc("backToOnce")}
          </a>
        </div>
      </form>
    );

  if (step === "code")
    return (
      <form
        className="max-w-[440px] lg:pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
      >
        <Eyebrow>{t("codeEyebrow")}</Eyebrow>
        <Display upper={false} className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]">
          {t("codeTitle")}
        </Display>
        <Lead className="mt-7 lg:mt-[clamp(11px,3.11vh,28px)]">{t("codeSent", { email })}</Lead>
        <div className="mt-12 lg:mt-[clamp(19px,5.33vh,48px)] grid gap-8 lg:gap-[clamp(12px,3.56vh,32px)]">
          {errorBox}
          <CodeInput value={code} onChange={setCode} label={t("code")} />
          <PrimaryButton type="submit" busy={busy} disabled={code.length !== 6}>
            {t("verify")}
          </PrimaryButton>
          <p className="text-center text-xs text-copper-2">
            {cooldown > 0 ? (
              t("resendIn", { time: formatTime(cooldown) })
            ) : (
              <button type="button" onClick={sendCode} disabled={busy} className="underline-offset-4 hover:underline">
                {t("resend")}
              </button>
            )}
          </p>
        </div>
        <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)]">
          <Divider />
          <button
            type="button"
            onClick={() => setStep("email")}
            className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] inline-flex items-center gap-4 text-[12px] text-copper hover:underline"
          >
            <ArrowLeft className="size-4" strokeWidth={1.4} />
            {t("changeEmail")}
          </button>
        </div>
      </form>
    );

  return (
    <form
      className="max-w-[440px] lg:pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        register();
      }}
    >
      <Eyebrow>{t("profileEyebrow")}</Eyebrow>
      <Display upper={false} className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)]">
        {t("profileTitle")}
      </Display>
      <Lead className="mt-7 lg:mt-[clamp(11px,3.11vh,28px)]">{t("profileIntro")}</Lead>
      <p className="mt-2 text-sm text-white">{email}</p>
      <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] grid gap-7 lg:gap-[clamp(11px,3.11vh,28px)]">
        {errorBox}
        <div className="grid gap-7 lg:gap-[clamp(11px,3.11vh,28px)] sm:grid-cols-2 sm:gap-4">
          <Field label={t("firstName")}>
            <TextInput
              autoComplete="given-name"
              required
              maxLength={80}
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            />
          </Field>
          <Field label={t("lastName")}>
            <TextInput
              autoComplete="family-name"
              required
              maxLength={80}
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            />
          </Field>
        </div>
        <Field label={t("country")} hint={t("countryNote")}>
          <SelectInput required value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}>
            <option value="" disabled>
              {t("countryPlaceholder")}
            </option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <PrimaryButton type="submit" busy={busy}>
          {t("create")}
        </PrimaryButton>
      </div>
    </form>
  );
}
