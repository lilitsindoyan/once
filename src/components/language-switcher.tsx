"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import clsx from "clsx";

const LABELS: Record<string, string> = { hy: "ՀԱՅ", en: "EN", ru: "РУС" };

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t("language")} className="flex gap-2 text-xs tracking-widest">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-current={l === locale}
          onClick={() => {
            const query = typeof window === "undefined" ? "" : window.location.search;
            router.replace(`${pathname}${query}`, { locale: l });
            router.refresh();
          }}
          className={clsx("px-1 py-1", l === locale ? "text-copper" : "text-mute hover:text-cream")}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
