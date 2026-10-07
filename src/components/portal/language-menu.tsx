"use client";

import { ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import clsx from "clsx";

const SHORT: Record<string, string> = { hy: "HY", en: "EN", ru: "RU" };
const NAMES: Record<string, string> = { hy: "Հայերեն", en: "English", ru: "Русский" };

export function LanguageMenu() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language")}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 py-2 text-[12px] text-cream hover:text-white"
      >
        <Globe className="size-[18px]" strokeWidth={1.4} />
        {SHORT[locale]}
        <ChevronDown className={clsx("size-3.5 transition", open && "rotate-180")} strokeWidth={1.5} />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 z-30 mt-2 min-w-[150px] border border-[#3b332c] bg-[#0d0b09] py-1 shadow-xl">
          {routing.locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setOpen(false);
                  router.replace(`${pathname}${window.location.search}`, { locale: l });
                  router.refresh();
                }}
                className={clsx(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] hover:bg-white/5",
                  l === locale ? "text-copper" : "text-cream",
                )}
              >
                {NAMES[l]}
                <span className="text-[11px] text-mute">{SHORT[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
