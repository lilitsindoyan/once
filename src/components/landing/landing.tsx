"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { LandingPin } from "@/server/landing";
import { LandingChrome, SECTIONS } from "./chrome";
import { ContactForm } from "./contact-form";
import { useActiveSection, useReveal, useSceneProgress } from "./hooks";
import { Loader } from "./loader";
import { WorldMap } from "./world-map";

/** Left edge of content on desktop, clear of the side menu. */
const PAD = "px-6 sm:px-12 lg:pr-[clamp(48px,5vw,80px)] lg:pl-[clamp(200px,16vw,256px)]";
const TITLE = "font-display text-white leading-[1.06]";
const BODY = "text-[15px] leading-[1.75] tracking-[0.02em] text-cream-2 sm:text-[16px]";

/**
 * Public landing — Figma landing frames 99–122, in prototype order:
 * intro → loader → bottle reveal → Home, About (112, 120, 121/122, 110, 109), History (113),
 * Product (114–116), Ownership (118), Map (117), Contact (119).
 * Images live in /public/landing/<role>.jpg so they can be swapped without code changes.
 */
export function Landing({
  pins,
  countryNames,
  loggedIn,
  contactEmail,
}: {
  pins: LandingPin[];
  countryNames: Record<string, string>;
  loggedIn: boolean;
  contactEmail?: string;
}) {
  const active = useActiveSection(SECTIONS);
  const [chrome, setChrome] = useState(false);
  const onHero = useCallback((p: number) => setChrome((c) => (p > 0.55 ? true : p < 0.45 ? false : c)), []);

  return (
    <>
      <Loader />
      <LandingChrome active={active} loggedIn={loggedIn} onLanding visible={chrome || active !== "home"} />
      <main className="bg-black">
        <Hero onProgress={onHero} />
        <div id="about" data-nav="about">
          <BornOfTradition />
          <CraftOfOnce />
          <FourDecades />
          <Essence />
          <Workshop />
        </div>
        <History />
        <Product />
        <Ownership />
        <MapSection pins={pins} countryNames={countryNames} />
        <Contact email={contactEmail} />
      </main>
    </>
  );
}

/* ───────────── Home: intro mark (99) → bottle reveal (111, 104–107) → hero (108) ───────────── */

function Hero({ onProgress }: { onProgress: (p: number) => void }) {
  const t = useTranslations("landing");
  const ref = useSceneProgress<HTMLElement>(onProgress);
  return (
    <section ref={ref} id="home" data-nav="home" className="scene relative h-[230vh] lg:h-[260vh]">
      <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden">
        {/* Bottle, revealed through a widening circle */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: "clamp(0, calc((var(--p) - 0.08) * 3.2), 1)",
            transform: "scale(calc(1.3 - 0.3 * min(var(--p) * 1.6, 1)))",
            clipPath: "circle(calc(14% + min(var(--p) * 1.6, 1) * 62%) at 50% 50%)",
          }}
        >
          <Image
            src="/landing/hero.jpg"
            alt={t("heroAlt")}
            width={472}
            height={505}
            priority
            className="h-auto max-h-[78dvh] w-[88vw] object-contain sm:w-auto sm:h-[78dvh]"
          />
        </div>

        {/* Intro mark: line · ONCE · line · 40 years aged exclusive blend */}
        <div
          className="relative flex flex-col items-center px-6 text-center"
          style={{
            opacity: "clamp(0, calc(1 - var(--p) * 4.5), 1)",
            transform: "translateY(calc(var(--p) * -60px))",
          }}
        >
          <span className="h-px w-[min(492px,72vw)] bg-gradient-to-r from-transparent via-cream/70 to-transparent" />
          <Image src="/once-logo.svg" alt="ONCE" width={522} height={112} priority className="my-[clamp(28px,8vh,72px)] h-auto w-[min(522px,70vw)]" />
          <span className="text-[13px] tracking-[0.42em] text-cream uppercase sm:text-[15px]">{t("intro")}</span>
          <span className="mt-[clamp(28px,8vh,64px)] h-px w-[min(492px,72vw)] bg-gradient-to-r from-transparent via-cream/70 to-transparent" />
        </div>

        <div
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] tracking-[0.3em] text-mute uppercase"
          style={{ opacity: "clamp(0, calc(1 - var(--p) * 6), 1)" }}
          aria-hidden
        >
          {t("scroll")}
          <ArrowDown className="size-4 animate-bounce" strokeWidth={1.2} />
        </div>
      </div>
    </section>
  );
}

/* ───────────── About ───────────── */

function BornOfTradition() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative flex min-h-dvh items-center overflow-hidden py-28">
      <div className="reveal-img absolute inset-y-0 right-0 w-full lg:w-[62%]">
        <Image src="/landing/about.jpg" alt="" fill sizes="(min-width:1024px) 62vw, 100vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black/10" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>
      <div className={`relative grid w-full gap-10 lg:grid-cols-[1fr_minmax(280px,392px)] lg:items-end ${PAD}`}>
        <h2 className={`reveal max-w-[600px] text-[44px] uppercase sm:text-[60px] lg:text-[clamp(52px,6.2vw,90px)] ${TITLE}`}>{t("aboutTitle")}</h2>
        <p className={`reveal ${BODY} lg:pb-6`} style={{ ["--d" as string]: "250ms" }}>
          {t("aboutText")}
        </p>
      </div>
    </section>
  );
}

function CraftOfOnce() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative min-h-dvh overflow-hidden">
      <div className="reveal-img absolute inset-0 lg:left-[37%]">
        <Image src="/landing/craft.jpg" alt="" fill sizes="(min-width:1024px) 63vw, 100vw" className="object-cover object-left opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-black/50" />
      </div>
      <div className="absolute inset-y-0 left-0 hidden w-[37%] bg-black lg:block" />
      <div className={`relative flex min-h-dvh flex-col justify-between gap-16 py-28 lg:py-[clamp(96px,15vh,135px)] ${PAD}`}>
        <div className="lg:ml-auto lg:w-[min(491px,40vw)]">
          <h2 className={`reveal text-[44px] uppercase sm:text-[60px] lg:text-[clamp(52px,6vw,86px)] ${TITLE}`}>{t("craftTitle")}</h2>
          <p className="reveal mt-4 text-[13px] tracking-[0.32em] text-cream uppercase" style={{ ["--d" as string]: "200ms" }}>
            {t("craftEyebrow")}
          </p>
        </div>
        <p className={`reveal max-w-[361px] ${BODY}`} style={{ ["--d" as string]: "350ms" }}>
          {t("craftText")}
        </p>
      </div>
    </section>
  );
}

function FourDecades() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>(0.3);
  return (
    <section ref={ref} className="relative flex min-h-dvh flex-col items-center overflow-hidden pt-28 lg:pt-[clamp(110px,15vh,140px)]">
      <p className="reveal max-w-[492px] px-6 text-center font-display text-[22px] leading-[1.4] text-cream sm:text-[26px]">{t("decadesText")}</p>
      <span className="reveal mt-5 h-px w-[266px] bg-gradient-to-r from-transparent via-copper to-transparent" style={{ ["--d" as string]: "200ms" }} />
      <div className="reveal-img relative mt-6 w-full flex-1" style={{ ["--d" as string]: "250ms" }}>
        <Image src="/landing/product.jpg" alt={t("heroAlt")} fill sizes="100vw" className="object-contain object-top" />
      </div>
    </section>
  );
}

function Essence() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>();
  const lines = ["essence1", "essence2", "essence3", "essence4"] as const;
  return (
    <section ref={ref} className="landing-glow relative flex min-h-dvh items-center py-28">
      <div className={`w-full ${PAD}`}>
        <h2 className={`reveal max-w-[560px] text-[44px] sm:text-[60px] lg:text-[clamp(52px,6vw,86px)] ${TITLE}`}>{t("essenceTitle")}</h2>
        <ul className="mt-[clamp(40px,9vh,80px)] space-y-[clamp(14px,2.6vh,24px)]">
          {lines.map((k, i) => (
            <li key={k} className="reveal flex items-baseline gap-4" style={{ ["--d" as string]: `${200 + i * 140}ms` }}>
              <span className="size-[7px] shrink-0 -translate-y-[5px] rounded-full bg-copper" aria-hidden />
              <span className="font-display text-[22px] leading-snug text-cream sm:text-[clamp(22px,2.2vw,32px)]">{t(k)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Workshop() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="relative flex min-h-dvh items-end overflow-hidden py-24 lg:py-[clamp(80px,14vh,128px)]">
      <div className="reveal-img absolute inset-0 lg:left-[6%]">
        <Image src="/landing/workshop.jpg" alt="" fill sizes="94vw" className="object-cover object-right opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black to-transparent" />
      </div>
      <div className={`relative w-full ${PAD}`}>
        <h2 className={`reveal max-w-[491px] text-[44px] uppercase sm:text-[60px] lg:text-[clamp(52px,6vw,86px)] ${TITLE}`}>{t("craftTitle")}</h2>
        <p className="reveal mt-5 max-w-[360px] text-[13px] leading-[2.2] tracking-[0.32em] text-cream uppercase" style={{ ["--d" as string]: "200ms" }}>
          {t("workshopText")}
        </p>
      </div>
    </section>
  );
}

/* ───────────── History (113) ───────────── */

function History() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id="history" data-nav="history" className="relative flex min-h-dvh flex-col overflow-hidden py-28 lg:py-[clamp(96px,17vh,160px)]">
      <div className="reveal-img absolute inset-0">
        <Image src="/landing/history.jpg" alt="" fill sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black" />
      </div>
      <div className={`relative ${PAD}`}>
        <h2 className={`reveal max-w-[1105px] text-[34px] uppercase sm:text-[46px] lg:text-[clamp(40px,4.4vw,64px)] ${TITLE}`}>
          {t("historyTitle")} <span className="text-cream">{t("historySub")}</span>
        </h2>
        <div className="mx-auto mt-[clamp(32px,6vh,56px)] max-w-[475px] lg:ml-[clamp(120px,26vw,315px)]">
          <span className="reveal block h-px w-[min(354px,70vw)] bg-gradient-to-r from-copper to-transparent" style={{ ["--d" as string]: "200ms" }} />
          <p className={`reveal mt-8 ${BODY}`} style={{ ["--d" as string]: "320ms" }}>
            {t("historyText")}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Product: the art of unveiling (114 → 115 → 116) ───────────── */

function Product() {
  const t = useTranslations("landing");
  const ref = useSceneProgress<HTMLElement>();
  return (
    <section ref={ref} id="product" data-nav="product" className="scene relative h-[200vh] lg:h-[240vh]">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ transform: "scale(calc(1.25 - var(--p) * 0.25)) translateX(calc((0.5 - var(--p)) * 6%))" }}
        >
          <Image src="/landing/unveil.jpg" alt={t("heroAlt")} fill sizes="100vw" className="object-contain" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />

        <p
          className="absolute top-[clamp(96px,15vh,136px)] right-6 max-w-[325px] text-[15px] leading-[1.7] text-cream sm:right-12 lg:left-[57%]"
          style={{ opacity: "clamp(0, calc(1 - (var(--p) - 0.3) * 4), 1)" }}
        >
          {t("productText")}
        </p>

        <div
          className="absolute right-6 bottom-[clamp(64px,13vh,110px)] max-w-[300px] sm:right-12 lg:left-[76%]"
          style={{
            opacity: "clamp(0, calc((var(--p) - 0.45) * 4), 1)",
            transform: "translateY(calc((1 - clamp(0, (var(--p) - 0.45) * 4, 1)) * 30px))",
          }}
        >
          <h2 className={`text-[34px] ${TITLE}`}>{t("unveilTitle")}</h2>
          <p className="mt-3 text-[14px] tracking-[0.04em] text-cream-2">{t("unveilSub")}</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Ownership (118) ───────────── */

const STEP_ICONS = [
  // card with QR
  <svg key="1" viewBox="0 0 90 50" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-[50px] w-[90px]">
    <rect x="1" y="1" width="88" height="48" rx="3" />
    <path d="M8 9h14v14H8zM12 13h6v6h-6zM8 28h14v13H8zM27 9h4M27 15h4v6M33 27h4M27 36h6" />
    <path d="M44 12h20M44 20h30M44 26h26M44 32h18" strokeOpacity=".7" />
  </svg>,
  // bottle
  <svg key="2" viewBox="0 0 60 70" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-[70px] w-[60px]">
    <path d="M23 2h14l-2 9H25z" />
    <circle cx="30" cy="40" r="28" />
  </svg>,
  // person + check
  <svg key="3" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-[64px] w-[64px]">
    <circle cx="28" cy="18" r="12" />
    <path d="M4 58c0-13 10-22 24-22 6 0 11 2 15 5" />
    <circle cx="49" cy="49" r="10" />
    <path d="m44 49 4 4 7-7" />
  </svg>,
  // history list
  <svg key="4" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-[64px] w-[64px]">
    <path d="M14 4v56" strokeDasharray="2 3" />
    {[8, 22, 36, 50].map((y) => (
      <g key={y}>
        <circle cx="14" cy={y + 2} r="5" />
        <path d={`M24 ${y}h20M24 ${y + 5}h32`} strokeOpacity=".7" />
      </g>
    ))}
  </svg>,
];

function Ownership() {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>(0.15);
  return (
    <section ref={ref} id="ownership" data-nav="ownership" className="once-texture relative flex min-h-dvh items-center py-28">
      <div className={`w-full ${PAD}`}>
        <p className="reveal text-[15px] tracking-[0.08em] text-copper uppercase sm:text-[17px]">{t("ownEyebrow")}</p>
        <h2 className={`reveal mt-1 text-[40px] sm:text-[52px] lg:text-[clamp(40px,4.2vw,60px)] ${TITLE}`} style={{ ["--d" as string]: "100ms" }}>
          {t("ownTitle")}
        </h2>
        <ol className="mt-[clamp(32px,7vh,72px)] grid gap-12 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {([1, 2, 3, 4] as const).map((n, i) => (
            <li key={n} className="reveal flex flex-col items-center text-center" style={{ ["--d" as string]: `${200 + i * 150}ms` }}>
              <span className="font-display text-[32px] text-copper">{String(n).padStart(2, "0")}</span>
              <span className="mt-[clamp(20px,5vh,56px)] flex h-[72px] items-center text-copper">{STEP_ICONS[i]}</span>
              <h3 className="mt-[clamp(20px,5vh,56px)] font-display text-[26px] text-cream">{t(`step${n}Title`)}</h3>
              <p className="mt-3 max-w-[270px] text-[13px] leading-[1.7] text-cream-2">{t(`step${n}Text`)}</p>
            </li>
          ))}
        </ol>
        <div className="reveal mt-[clamp(32px,6vh,56px)] flex justify-center xl:justify-end" style={{ ["--d" as string]: "800ms" }}>
          <Link href="/claim" className="bg-[#1a1716] px-10 py-4 text-[13px] tracking-[0.26em] text-cream uppercase transition hover:bg-[#2a221c]">
            {t("claimNow")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Map (117) ───────────── */

function MapSection({ pins, countryNames }: { pins: LandingPin[]; countryNames: Record<string, string> }) {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>(0.15);
  return (
    <section ref={ref} id="map" data-nav="map" className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-black py-24 lg:py-16">
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[620px] rounded-full bg-[radial-gradient(circle,rgba(150,66,22,0.35),transparent_65%)]" />
      <div className="relative mx-auto w-full max-w-[1300px] lg:pr-12 lg:pl-[clamp(150px,11vw,200px)]">
        <div className="reveal-img lg:ml-auto lg:w-[min(100%,calc(84dvh*1.497))]">
          <WorldMap pins={pins} countryName={countryNames} />
        </div>
      </div>
      <div className={`relative mt-10 lg:absolute lg:bottom-[clamp(48px,10vh,96px)] lg:left-0 lg:mt-0 ${PAD}`}>
        <h2 className={`reveal max-w-[300px] text-[40px] sm:text-[clamp(40px,3.6vw,52px)] ${TITLE} !text-cream`}>{t("mapTitle")}</h2>
        <p className="reveal mt-4 max-w-[270px] text-[13px] leading-[1.7] tracking-[0.06em] text-mute uppercase" style={{ ["--d" as string]: "150ms" }}>
          {t("mapText")}
        </p>
        <Link
          href="/owners"
          className="reveal mt-6 inline-flex items-center gap-2 text-[12px] tracking-[0.2em] text-copper uppercase hover:text-white"
          style={{ ["--d" as string]: "300ms" }}
        >
          {t("viewOwners")}
          <ArrowRight className="size-4" strokeWidth={1.2} />
        </Link>
      </div>
    </section>
  );
}

/* ───────────── Contact (119) ───────────── */

function Contact({ email }: { email?: string }) {
  const t = useTranslations("landing");
  const ref = useReveal<HTMLElement>(0.15);
  return (
    <section ref={ref} id="contact" data-nav="contact" className="landing-glow relative flex min-h-dvh flex-col py-28 lg:py-[clamp(96px,18vh,183px)]">
      <div className={`w-full flex-1 ${PAD}`}>
        <div className="mx-auto max-w-[760px]">
          <h2 className={`reveal text-[44px] uppercase sm:text-[56px] ${TITLE}`}>{t("contactTitle")}</h2>
          <p className="reveal mt-3 text-[16px] text-cream-2" style={{ ["--d" as string]: "120ms" }}>
            {t("contactText")}
          </p>
          <div className="reveal" style={{ ["--d" as string]: "240ms" }}>
            <ContactForm />
          </div>
          <div className="reveal mt-[clamp(32px,6vh,56px)] flex flex-wrap items-end justify-between gap-6" style={{ ["--d" as string]: "360ms" }}>
            <div>
              <p className="font-display text-[18px] text-cream">{t("contactSocial")}</p>
              <div className="mt-3 flex gap-5 text-[13px] tracking-[0.12em] text-cream-2 uppercase">
                {email && (
                  <a href={`mailto:${email}`} className="hover:text-white">
                    {email}
                  </a>
                )}
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-white">
                  Instagram
                </a>
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="hover:text-white">
                  Facebook
                </a>
              </div>
            </div>
            <a href="#home" className="inline-flex items-center gap-2 text-[13px] tracking-[0.16em] text-copper uppercase hover:text-white">
              <ArrowUp className="size-4" strokeWidth={1.2} />
              {t("backHome")}
            </a>
          </div>
        </div>
      </div>
      <p className={`mt-16 text-[11px] tracking-[0.2em] text-mute uppercase ${PAD}`}>© {new Date().getFullYear()} ONCE</p>
    </section>
  );
}
