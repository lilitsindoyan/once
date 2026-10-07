"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError, useErrorMessage } from "@/lib/client";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";

type Step = "email" | "code" | "profile";

export function LoginFlow({
  next,
  presetEmail,
  verifiedEmail,
  countries,
}: {
  next: string;
  presetEmail: string;
  verifiedEmail: string | null;
  countries: { code: string; name: string }[];
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

  return (
    <Card>
      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      {step === "email" && (
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
        >
          <p className="text-cream">{t("intro")}</p>
          <Field label={t("email")}>
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </Field>
          <Button type="submit" busy={busy}>
            {tc("continue")}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <div>
            <h2 className="font-display text-2xl text-cream">{t("codeTitle")}</h2>
            <p className="mt-2 text-sm text-mute">{t("codeSent", { email })}</p>
          </div>
          <Field label={t("code")}>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center font-display text-3xl tracking-[0.5em]"
              autoFocus
            />
          </Field>
          <Button type="submit" busy={busy} disabled={code.length !== 6}>
            {t("verify")}
          </Button>
          <div className="flex flex-wrap justify-between gap-4">
            <Button type="button" variant="ghost" disabled={cooldown > 0 || busy} onClick={sendCode}>
              {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep("email")}>
              {t("changeEmail")}
            </Button>
          </div>
        </form>
      )}

      {step === "profile" && (
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            register();
          }}
        >
          <div>
            <h2 className="font-display text-2xl text-cream">{t("profileTitle")}</h2>
            <p className="mt-2 text-sm text-mute">{t("profileIntro")}</p>
            <p className="mt-1 text-sm text-cream">{email}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={t("firstName")}>
              <Input
                autoComplete="given-name"
                required
                maxLength={80}
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </Field>
            <Field label={t("lastName")}>
              <Input
                autoComplete="family-name"
                required
                maxLength={80}
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </Field>
          </div>
          <Field label={t("country")} hint={t("countryNote")}>
            <Select required value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}>
              <option value="" disabled>
                {t("countryPlaceholder")}
              </option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" busy={busy}>
            {t("create")}
          </Button>
        </form>
      )}
    </Card>
  );
}
