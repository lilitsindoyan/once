"use client";

import clsx from "clsx";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { MAP_ASPECT, projectPct } from "@/lib/map-projection";
import type { LandingPin } from "@/server/landing";

/** Figma frame 117: dark world map, glowing pins, a card for the selected pin. */
export function WorldMap({
  pins,
  countryName,
}: {
  pins: LandingPin[];
  countryName: Record<string, string>;
}) {
  const withBottles = pins.filter((p) => p.latest);
  const [sel, setSel] = useState<string | null>(
    withBottles[0]?.countryCode ?? null,
  );
  const pin = pins.find((p) => p.countryCode === sel);
  const pos = pin ? projectPct(pin.lat, pin.lng) : null;

  return (
    <>
      <div className="relative w-full" style={{ aspectRatio: MAP_ASPECT }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed */}
        <img
          src="/landing/world.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 size-full select-none"
          draggable={false}
        />

        {pins.map((p, i) => {
          const { x, y } = projectPct(p.lat, p.lng);
          const on = p.countryCode === sel;
          return (
            <button
              key={p.countryCode}
              type="button"
              onClick={() => setSel(p.countryCode)}
              onMouseEnter={() => setSel(p.countryCode)}
              onFocus={() => setSel(p.countryCode)}
              aria-label={countryName[p.countryCode] ?? p.countryCode}
              aria-pressed={on}
              className="reveal absolute -translate-x-1/2 -translate-y-1/2 p-2"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                ["--d" as string]: `${300 + i * 60}ms`,
              }}
            >
              <span
                className={clsx(
                  "map-pin block rounded-full bg-[#ffb36b] shadow-[0_0_10px_3px_rgba(255,160,80,0.6)] transition-all",
                  on ? "size-[11px] ring-4 ring-[#ffb36b]/25" : "size-[7px]",
                )}
                style={{ ["--d" as string]: `${(i % 7) * 350}ms` }}
              />
            </button>
          );
        })}

        {pin && pos && (
          <div
            role="status"
            className={clsx(
              "pointer-events-none absolute z-10 hidden w-[290px] rounded-[14px] border border-copper/70 bg-black/85 p-5 backdrop-blur-sm transition-all duration-300 lg:block",
              pos.x < 20 ? "translate-x-[-12%]" : pos.x > 80 ? "-translate-x-[88%]" : "-translate-x-1/2",
              pos.y < 38 ? "translate-y-[22px]" : "-translate-y-[calc(100%+22px)]",
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <PinCard pin={pin} countryName={countryName} />
          </div>
        )}
      </div>
      {pin && (
        <div className="mx-6 mt-5 rounded-[14px] border border-copper/60 bg-black/70 p-4 sm:mx-12 lg:hidden">
          <PinCard pin={pin} countryName={countryName} />
        </div>
      )}
    </>
  );
}

function PinCard({
  pin,
  countryName,
}: {
  pin: LandingPin;
  countryName: Record<string, string>;
}) {
  const t = useTranslations("landing");
  const format = useFormatter();
  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 40 46"
        className="h-12 w-11 shrink-0 text-copper"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        aria-hidden
      >
        <path d="M15 2h10l-1 6h-8z" />
        <circle cx="20" cy="27" r="17" />
      </svg>
      <div className="min-w-0">
        {pin.latest ? (
          <>
            <p className="font-display text-[19px] tracking-[0.04em] text-cream">
              {pin.latest.serial}
            </p>
            <p className="mt-1.5 text-[10px] tracking-[0.12em] text-mute uppercase">
              {pin.latest.series}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.12em] text-mute uppercase">
              {t("mapClaimed", {
                date: format.dateTime(new Date(pin.latest.claimedAt), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              })}
            </p>
          </>
        ) : (
          <p className="font-display text-[18px] text-cream">
            {countryName[pin.countryCode] ?? pin.countryCode}
          </p>
        )}
        <p className="mt-2 text-[11px] text-copper">
          {countryName[pin.countryCode] ?? pin.countryCode} ·{" "}
          {t("mapCount", { count: pin.count })}
        </p>
      </div>
    </div>
  );
}
