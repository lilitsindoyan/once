"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, ApiError, useErrorMessage } from "@/lib/client";
import { CodeInput, formatTime } from "@/components/portal/code-input";
import { Field, Lead, Notice, OutlineButton, PageHeading, PrimaryButton, TextInput } from "@/components/portal/kit";
import { BackToProfile, SuccessPanel } from "../edit/edit-form";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("profile");
  const tl = useTranslations("login");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
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
      await api("/api/me/email", { email: newEmail, locale });
      setSent(true);
      setCode("");
      setCooldown(60);
    });

  const confirm = () =>
    run(async () => {
      await api("/api/me/email/confirm", { email: newEmail, code });
      setDone(true);
      router.refresh();
    });

  return (
    <>
      <BackToProfile />
      <PageHeading title={t("emailTitle")} />
      <Lead className="mt-4 max-w-[520px]">{t("emailIntro")}</Lead>
      <div className="mt-10">
        {done ? (
          <SuccessPanel title={t("emailUpdatedTitle")} text={t("emailUpdatedText")} />
        ) : (
          <form
            className="grid max-w-[520px] gap-7"
            onSubmit={(e) => {
              e.preventDefault();
              if (sent) confirm();
              else sendCode();
            }}
          >
            {error && <Notice>{error}</Notice>}
            <Field label={t("currentEmail")}>
              <TextInput value={currentEmail} readOnly disabled className="opacity-60" />
            </Field>
            <Field label={t("newEmail")}>
              <TextInput
                type="email"
                required
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setSent(false);
                }}
                autoFocus
              />
            </Field>
            {sent && (
              <>
                <Lead>{t("codeSentTo", { email: newEmail })}</Lead>
                <CodeInput value={code} onChange={setCode} label={tl("code")} />
                <p className="text-xs text-copper-2">
                  {cooldown > 0 ? (
                    tl("resendIn", { time: formatTime(cooldown) })
                  ) : (
                    <button type="button" onClick={sendCode} className="underline-offset-4 hover:underline">
                      {tl("resend")}
                    </button>
                  )}
                </p>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <PrimaryButton type="submit" busy={busy} disabled={sent && code.length !== 6} arrow={false}>
                {sent ? t("verify") : t("sendCode")}
              </PrimaryButton>
              <OutlineButton type="button" onClick={() => router.push("/profile")}>
                {tc("cancel")}
              </OutlineButton>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
