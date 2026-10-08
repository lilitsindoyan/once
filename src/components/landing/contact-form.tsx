"use client";

import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { api, useErrorMessage } from "@/lib/client";

type Field = "name" | "email" | "message";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Figma frame 119 — Name / Email / Message, saved for the admin panel. Own validation, in the page's style. */
export function ContactForm() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(data: Record<Field, string>) {
    const e: Partial<Record<Field, string>> = {};
    if (!data.name.trim()) e.name = t("contactErrName");
    if (!EMAIL.test(data.email.trim())) e.email = t("contactErrEmail");
    if (!data.message.trim()) e.message = t("contactErrMessage");
    return e;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<Field, string>;
    const found = validate(data);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    setState("sending");
    try {
      await api("/api/contact", { ...data, locale });
      form.reset();
      setState("sent");
    } catch (err) {
      setServerError(errorMessage(err));
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="menu-in flex flex-col items-start">
        <span className="grid size-14 place-items-center rounded-full border border-copper/70 text-copper">
          <Check className="size-6" strokeWidth={1.3} />
        </span>
        <p className="mt-6 font-display text-[30px] leading-tight text-cream">{t("contactSent")}</p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-8 text-[12px] tracking-[0.2em] text-copper uppercase hover:text-white"
        >
          {t("contactAgain")}
        </button>
      </div>
    );
  }

  const field = (name: Field, label: string, input: React.ReactNode, wide = false) => (
    <label className={clsx("group block", wide && "sm:col-span-2")}>
      <span className="text-[11px] tracking-[0.24em] text-mute uppercase transition-colors group-focus-within:text-copper">{label}</span>
      <span className="relative mt-2 block">
        {input}
        <span
          aria-hidden
          className={clsx(
            "absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-700 ease-out",
            errors[name] ? "scale-x-100 bg-danger" : "scale-x-0 bg-copper group-focus-within:scale-x-100",
          )}
        />
      </span>
      <span id={`${name}-error`} className={clsx("mt-2 block min-h-[16px] text-[12px] text-danger transition-opacity", errors[name] ? "opacity-100" : "opacity-0")}>
        {errors[name]}
      </span>
    </label>
  );

  const input =
    "block w-full border-0 border-b border-[#4a403a] bg-transparent px-0 pb-3 font-display text-[20px] text-white placeholder:text-[#5d534c] focus:ring-0 focus:outline-none focus-visible:outline-none";

  return (
    <form onSubmit={submit} noValidate className="grid gap-x-10 gap-y-[clamp(4px,1.6vh,14px)] sm:grid-cols-2">
      {field(
        "name",
        t("contactName"),
        <input
          name="name"
          maxLength={120}
          autoComplete="name"
          placeholder={t("contactNamePh")}
          aria-invalid={!!errors.name}
          aria-describedby="name-error"
          onInput={() => errors.name && setErrors((x) => ({ ...x, name: undefined }))}
          className={input}
        />,
      )}
      {field(
        "email",
        t("contactEmail"),
        <input
          name="email"
          type="email"
          maxLength={254}
          autoComplete="email"
          placeholder="name@example.com"
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
          onInput={() => errors.email && setErrors((x) => ({ ...x, email: undefined }))}
          className={input}
        />,
      )}
      {field(
        "message",
        t("contactMessage"),
        <textarea
          name="message"
          maxLength={4000}
          rows={3}
          placeholder={t("contactMessagePh")}
          aria-invalid={!!errors.message}
          aria-describedby="message-error"
          onInput={() => errors.message && setErrors((x) => ({ ...x, message: undefined }))}
          className={`${input} resize-none leading-snug`}
        />,
        true,
      )}
      <div className="flex flex-wrap items-center gap-6 pt-[clamp(4px,1.5vh,14px)] sm:col-span-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="group/btn inline-flex items-center gap-4 bg-gradient-to-r from-bronze-1 to-bronze-2 px-9 py-4 text-[12px] tracking-[0.26em] text-white uppercase transition hover:brightness-110 disabled:opacity-60"
        >
          {state === "sending" ? t("contactSending") : t("contactSend")}
          <ArrowRight className="size-4 transition-transform duration-500 group-hover/btn:translate-x-1" strokeWidth={1.3} />
        </button>
        {serverError && (
          <p role="alert" className="text-[13px] text-danger">
            {serverError}
          </p>
        )}
      </div>
    </form>
  );
}
