"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { pauseScroll, resumeScroll } from "./smooth-scroll";

const KEY = "once-loader-seen";
const DURATION = 1900;

/** Figma frames 100–103: "Welcome to ONCE" with a 0 → 100% counter. Shown once per browser session. */
export function Loader() {
  const t = useTranslations("landing");
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"on" | "fading" | "off">("on");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      setPhase("off");
      return;
    }
    document.documentElement.style.overflow = "hidden";
    pauseScroll();
    const start = performance.now();
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = (now: number) => {
      const x = Math.min(1, (now - start) / DURATION);
      setPct(Math.round(100 * (1 - Math.pow(1 - x, 2.2))));
      if (x < 1) raf = requestAnimationFrame(tick);
      else {
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {}
        setPhase("fading");
        document.documentElement.style.overflow = "";
        resumeScroll();
        timer = setTimeout(() => setPhase("off"), 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      document.documentElement.style.overflow = "";
      resumeScroll();
    };
  }, []);

  if (phase === "off") return null;

  return (
    <div
      aria-hidden
      data-loader
      className={clsx(
        "fixed inset-0 z-[60] flex items-center justify-center bg-black bg-cover bg-center transition-opacity duration-[900ms]",
        phase === "fading" && "pointer-events-none opacity-0",
      )}
      style={{ backgroundImage: "url(/landing/loader.jpg)" }}
    >
      <noscript>
        <style>{`[data-loader]{display:none}html{overflow:auto!important}`}</style>
      </noscript>
      <div className="flex flex-col items-center px-6 text-center">
        <p className="text-[11px] tracking-[0.42em] text-cream uppercase sm:text-[13px]">{t("loaderEyebrow")}</p>
        <p className="mt-6 font-display text-[40px] leading-none tracking-[0.02em] text-[#c7b9a9] uppercase sm:text-[60px] lg:text-[64px]">
          {t("loaderTitle")}
        </p>
        <p className="mt-7 font-display text-[34px] text-[#c7b9a9] tabular-nums sm:text-[40px]">{pct}%</p>
      </div>
    </div>
  );
}
