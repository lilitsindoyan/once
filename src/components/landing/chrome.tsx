"use client";

import clsx from "clsx";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { scrollToSection } from "./smooth-scroll";

export const SECTIONS = ["home", "about", "history", "product", "ownership", "map", "contact"] as const;
export type SectionId = (typeof SECTIONS)[number];

/**
 * Header + numbered side menu from the landing frames (108–119).
 * On the landing the menu scrolls to sections; elsewhere (Owners page) it links back to them.
 */
export function LandingChrome({
  active,
  loggedIn,
  onLanding,
  visible = true,
}: {
  active: SectionId;
  loggedIn: boolean;
  onLanding: boolean;
  visible?: boolean;
}) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const railRef = useRef<HTMLOListElement>(null);
  const [dotTop, setDotTop] = useState(4);

  useEffect(() => {
    const place = () => {
      const li = railRef.current?.children[SECTIONS.indexOf(active)] as HTMLElement | undefined;
      if (li) setDotTop(li.offsetTop + 3);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: SectionId) => (e: React.MouseEvent) => {
    setOpen(false);
    if (!onLanding) return; // normal link to /#id
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    scrollToSection(el);
    history.replaceState(null, "", `#${id}`);
  };

  const item = (id: SectionId, i: number, big = false) => (
    <li key={id} className={big ? "menu-in" : undefined} style={big ? { ["--d" as string]: `${80 + i * 60}ms` } : undefined}>
      <Link
        href={{ pathname: "/", hash: id }}
        onClick={go(id)}
        aria-current={active === id ? "true" : undefined}
        className="group relative block"
      >
        <span className={clsx("block font-serif text-mute", big ? "text-[15px]" : "text-[13px] leading-none")}>{String(i + 1).padStart(2, "0")}</span>
        <span
          className={clsx(
            "block font-serif tracking-[0.06em] uppercase transition-colors",
            big ? "mt-1 text-[30px] text-white" : "mt-1 text-[15px] leading-none",
            !big && (active === id ? "text-white" : "text-cream-2 group-hover:text-white"),
          )}
        >
          {t(`nav.${id}`)}
        </span>
      </Link>
    </li>
  );

  return (
    <div className={clsx("transition-opacity duration-700", visible ? "opacity-100" : "pointer-events-none opacity-0")}>
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 py-5 sm:px-12 sm:py-[clamp(20px,4.4vh,40px)]">
        <Link href="/" aria-label="ONCE" className="shrink-0">
          <Image src="/once-logo.svg" alt="ONCE" width={162} height={35} priority className="h-6 w-auto sm:h-[35px]" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <Link
            href="/claim"
            className="border border-copper-border px-3 py-2 font-serif text-[15px] text-white transition hover:bg-copper/20 sm:px-[18px] sm:text-lg"
          >
            {tc("claimYourBottle")}
          </Link>
          <Link href={loggedIn ? "/my-bottles" : "/login"} aria-label={loggedIn ? tc("myBottles") : tc("login")} title={loggedIn ? tc("myBottles") : tc("login")}>
            <Image src="/icon-user.svg" alt="" width={32} height={32} className="size-7 sm:size-8" />
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label={t("menu")} className="p-1 text-white lg:hidden">
            <Menu className="size-7" strokeWidth={1.2} />
          </button>
        </div>
      </header>

      {/* Desktop side menu */}
      <nav aria-label={t("menu")} className="fixed top-1/2 left-[36px] z-30 hidden -translate-y-1/2 lg:block">
        <ol ref={railRef} className="relative flex flex-col gap-[clamp(22px,4.6vh,46px)] border-l border-white/40 py-1 pl-[19px]">
          {SECTIONS.map((id, i) => item(id, i))}
          {/* Copper progress along the rail and the marker that glides to the current section */}
          <span aria-hidden className="absolute top-0 -left-px w-px bg-copper transition-[height] duration-700 ease-out" style={{ height: dotTop + 6 }} />
          <span
            aria-hidden
            className="absolute -left-[6px] size-[11px] rounded-full border border-white bg-black transition-[top] duration-700 ease-[cubic-bezier(0.6,0,0.2,1)]"
            style={{ top: dotTop }}
          />
        </ol>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div role="dialog" aria-modal="true" aria-label={t("menu")} className="landing-glow fixed inset-0 z-50 flex flex-col px-6 py-5 lg:hidden">
          <div className="flex items-center justify-between">
            <Image src="/once-logo.svg" alt="ONCE" width={162} height={35} className="h-6 w-auto" />
            <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="p-1 text-white">
              <X className="size-7" strokeWidth={1.2} />
            </button>
          </div>
          <ol className="mt-10 flex flex-col gap-5">{SECTIONS.map((id, i) => item(id, i, true))}</ol>
          <div className="mt-auto pt-8">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}
