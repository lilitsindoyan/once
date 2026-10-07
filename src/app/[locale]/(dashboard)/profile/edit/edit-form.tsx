"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, useErrorMessage } from "@/lib/client";
import { Field, Lead, Notice, OutlineButton, PageHeading, PrimaryButton, PrimaryLink, SelectInput, TextInput } from "@/components/portal/kit";

export function BackToProfile() {
  const t = useTranslations("profile");
  return (
    <Link href="/profile" className="mb-8 lg:mb-[clamp(12px,3.56vh,32px)] inline-flex items-center gap-4 text-[11px] tracking-[0.14em] text-cream uppercase hover:text-white">
      <ArrowLeft className="size-4 text-copper" strokeWidth={1.4} />
      {t("backToProfile")}
    </Link>
  );
}

export function SuccessPanel({ title, text }: { title: string; text: string }) {
  const t = useTranslations("profile");
  return (
    <div className="max-w-[520px] border border-[#2b241e] bg-[#0d0b09]/85 p-8">
      <span className="grid size-[54px] place-items-center rounded-full border border-copper">
        <Check className="size-6 text-copper" strokeWidth={1.4} />
      </span>
      <h2 className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)] font-display text-[26px] tracking-[0.03em] text-white uppercase">{title}</h2>
      <Lead className="mt-3">{text}</Lead>
      <PrimaryLink href="/profile" className="mt-8 lg:mt-[clamp(12px,3.56vh,32px)]">
        {t("backToProfile")}
      </PrimaryLink>
    </div>
  );
}

export function EditDetailsForm({
  initial,
  country,
}: {
  initial: { firstName: string; lastName: string; locale: string };
  country: string;
}) {
  const t = useTranslations("profile");
  const tl = useTranslations("login");
  const tc = useTranslations("common");
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/me/profile", form, "PATCH");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BackToProfile />
      <PageHeading title={t("editTitle")} />
      <Lead className="mt-4 max-w-[520px]">{t("editIntro")}</Lead>
      <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)]">
        {done ? (
          <SuccessPanel title={t("updatedTitle")} text={t("updatedText")} />
        ) : (
          <form
            className="grid max-w-[520px] gap-7 lg:gap-[clamp(11px,3.11vh,28px)]"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            {error && <Notice>{error}</Notice>}
            <div className="grid gap-7 lg:gap-[clamp(11px,3.11vh,28px)] sm:grid-cols-2 sm:gap-4">
              <Field label={tl("firstName")}>
                <TextInput required maxLength={80} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field label={tl("lastName")}>
                <TextInput required maxLength={80} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
            </div>
            <Field label={t("country")} hint={t("countryReadonly")}>
              <TextInput value={country} readOnly disabled className="opacity-60" />
            </Field>
            <Field label={t("language")}>
              <SelectInput value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
                <option value="hy">Հայերեն</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </SelectInput>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <PrimaryButton type="submit" busy={busy} arrow={false}>
                {t("save")}
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
