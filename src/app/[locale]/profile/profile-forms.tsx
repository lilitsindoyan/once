"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, useErrorMessage } from "@/lib/client";
import { Alert, Button, Card, Field, Input, KeyValue, Select } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

type Props = { user: { email: string; firstName: string; lastName: string; country: string; locale: string } };

export function ProfileForms({ user }: Props) {
  const t = useTranslations("profile");
  const tl = useTranslations("login");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  const [name, setName] = useState({ firstName: user.firstName, lastName: user.lastName });
  const [mailLocale, setMailLocale] = useState(user.locale);
  const [nameMsg, setNameMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const [emailStep, setEmailStep] = useState<"idle" | "enter" | "code">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveName() {
    setBusy(true);
    setNameMsg(null);
    try {
      await api("/api/me/profile", { ...name, locale: mailLocale }, "PATCH");
      setNameMsg({ tone: "ok", text: tc("saved") });
      router.refresh();
    } catch (e) {
      setNameMsg({ tone: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    setBusy(true);
    setEmailMsg(null);
    try {
      await api("/api/me/email", { email: newEmail, locale });
      setEmailStep("code");
    } catch (e) {
      setEmailMsg({ tone: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  async function confirmEmail() {
    setBusy(true);
    setEmailMsg(null);
    try {
      await api("/api/me/email/confirm", { email: newEmail, code });
      setEmailMsg({ tone: "ok", text: t("emailChanged") });
      setEmailStep("idle");
      setCode("");
      router.refresh();
    } catch (e) {
      setEmailMsg({ tone: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8">
      <Card>
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <h2 className="font-display text-2xl text-cream">{t("name")}</h2>
          {nameMsg && <Alert tone={nameMsg.tone}>{nameMsg.text}</Alert>}
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={tl("firstName")}>
              <Input required maxLength={80} value={name.firstName} onChange={(e) => setName({ ...name, firstName: e.target.value })} />
            </Field>
            <Field label={tl("lastName")}>
              <Input required maxLength={80} value={name.lastName} onChange={(e) => setName({ ...name, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label={t("language")}>
            <Select value={mailLocale} onChange={(e) => setMailLocale(e.target.value)}>
              <option value="hy">Հայերեն</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </Select>
          </Field>
          <div>
            <Button type="submit" busy={busy}>
              {tc("save")}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 font-display text-2xl text-cream">{t("email")}</h2>
        {emailMsg && (
          <div className="mb-4">
            <Alert tone={emailMsg.tone}>{emailMsg.text}</Alert>
          </div>
        )}
        <p className="text-cream">{user.email}</p>

        {emailStep === "idle" && (
          <Button variant="ghost" className="mt-4" onClick={() => setEmailStep("enter")}>
            {t("changeEmail")}
          </Button>
        )}
        {emailStep === "enter" && (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              sendCode();
            }}
          >
            <Field label={t("newEmail")}>
              <Input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoFocus />
            </Field>
            <div className="flex gap-4">
              <Button type="submit" busy={busy}>
                {t("sendCode")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEmailStep("idle")}>
                {tc("cancel")}
              </Button>
            </div>
          </form>
        )}
        {emailStep === "code" && (
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              confirmEmail();
            }}
          >
            <p className="text-sm text-mute">{t("codeSentTo", { email: newEmail })}</p>
            <Field label={tl("code")}>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center font-display text-2xl tracking-[0.5em]"
                autoFocus
              />
            </Field>
            <div className="flex gap-4">
              <Button type="submit" busy={busy} disabled={code.length !== 6}>
                {t("confirmEmail")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEmailStep("enter")}>
                {tc("back")}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <dl>
          <KeyValue label={t("country")}>
            {user.country}
            <span className="mt-1 block text-xs text-mute">{t("countryReadonly")}</span>
          </KeyValue>
        </dl>
      </Card>

      <div>
        <LogoutButton label={tc("logout")} />
      </div>
    </div>
  );
}
