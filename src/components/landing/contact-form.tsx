"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { api, useErrorMessage } from "@/lib/client";

const field =
  "mt-3 w-full border-0 border-b border-[#6d625a] bg-transparent px-0 pb-3 text-[16px] text-white placeholder:text-mute focus:border-copper focus:ring-0 focus:outline-none";

/** Figma frame 119 — Name / Email / Message, saved for the admin panel. */
export function ContactForm() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState("sending");
    setError(null);
    try {
      await api("/api/contact", { ...data, locale });
      form.reset();
      setState("sent");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="mt-10 font-display text-[26px] text-cream">
        {t("contactSent")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-[clamp(24px,6vh,64px)] grid gap-x-12 gap-y-[clamp(20px,4.5vh,44px)] sm:grid-cols-2">
      <label className="block">
        <span className="font-display text-[18px] text-cream">{t("contactName")}</span>
        <input name="name" required maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className="block">
        <span className="font-display text-[18px] text-cream">{t("contactEmail")}</span>
        <input name="email" type="email" required maxLength={254} autoComplete="email" className={field} />
      </label>
      <label className="block sm:col-span-2">
        <span className="font-display text-[18px] text-cream">{t("contactMessage")}</span>
        <textarea name="message" required maxLength={4000} rows={3} className={`${field} resize-none`} />
      </label>
      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-gradient-to-r from-bronze-1 to-bronze-2 px-10 py-3.5 text-[13px] tracking-[0.2em] text-white uppercase transition hover:brightness-110 disabled:opacity-60"
        >
          {state === "sending" ? t("contactSending") : t("contactSend")}
        </button>
        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
