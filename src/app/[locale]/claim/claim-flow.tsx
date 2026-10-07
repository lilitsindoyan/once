"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, ApiError, useErrorMessage } from "@/lib/client";
import { Alert, Button, Card, Field, Input, linkButton, PrivacyChoice } from "@/components/ui";

type Bottle = { serial: string; series: string; batch: string };

export function ClaimFlow({ loggedIn, pending }: { loggedIn: boolean; pending: Bottle | null }) {
  const t = useTranslations("claim");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useErrorMessage();

  const [bottle, setBottle] = useState<Bottle | null>(pending);
  const [serial, setSerial] = useState("");
  const [code, setCode] = useState("");
  const [showName, setShowName] = useState(true);
  const [error, setError] = useState<{ text: string; contact?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    setError(null);
    try {
      setBottle(await api<Bottle>("/api/claim/check", { serial, code }));
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
      const res = await api<{ serial: string }>("/api/claim", { showName, locale });
      router.replace(`/my-bottles/${res.serial}`);
      router.refresh();
    } catch (e) {
      setError({ text: errorMessage(e) });
      if (e instanceof ApiError && (e.code === "claim_expired" || e.code === "claim_already_registered")) setBottle(null);
      setBusy(false);
    }
  }

  return (
    <Card>
      {error && (
        <div className="mb-6">
          <Alert>
            {error.text}{" "}
            {error.contact && (
              <a href={process.env.NEXT_PUBLIC_CONTACT_URL ?? "/"} className="underline">
                {tc("contactUs")}
              </a>
            )}
          </Alert>
        </div>
      )}

      {!bottle && (
        <form
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <p className="text-cream">{t("intro")}</p>
          <Field label={t("serial")} hint={t("serialHint")}>
            <Input
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              className="font-mono tracking-widest"
              autoFocus
            />
          </Field>
          <Field label={t("code")} hint={t("codeHint")}>
            <Input
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-widest"
            />
          </Field>
          <Button type="submit" busy={busy}>
            {t("check")}
          </Button>
        </form>
      )}

      {bottle && (
        <div className="grid gap-6">
          <div className="border-b border-line pb-6">
            <p className="text-xs tracking-[0.18em] text-mute uppercase">ONCE</p>
            <p className="mt-1 font-display text-3xl text-cream">{bottle.serial}</p>
            <p className="mt-1 text-sm text-copper">
              {bottle.series} · {bottle.batch}
            </p>
          </div>

          {loggedIn ? (
            <>
              <h2 className="font-display text-2xl text-cream">{t("privacyTitle")}</h2>
              <PrivacyChoice
                value={showName}
                onChange={setShowName}
                labels={{ show: t("showName"), showHint: t("showNameHint"), anon: t("anonymous"), anonHint: t("anonymousHint") }}
              />
              <Button onClick={claim} busy={busy}>
                {t("cta")}
              </Button>
            </>
          ) : (
            <>
              <p className="text-cream">{t("loginToContinue")}</p>
              <Link href={{ pathname: "/login", query: { next: "/claim" } }} className={linkButton}>
                {tc("login")}
              </Link>
            </>
          )}
          <Button variant="ghost" onClick={() => setBottle(null)}>
            {t("startOver")}
          </Button>
        </div>
      )}
    </Card>
  );
}
