"use client";

import Image from "next/image";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SmallLink } from "@/components/portal/kit";

type Bottle = { serial: string; series: string; batch: string; claimedOn: string };

/** One bottle at a time with arrows (design frame 242). */
export function BottleCarousel({ bottles, location, compact = false }: { bottles: Bottle[]; location: string; compact?: boolean }) {
  const t = useTranslations("bottles");
  const tc = useTranslations("common");
  const [i, setI] = useState(0);
  const b = bottles[i];
  const many = bottles.length > 1;
  const go = (d: number) => setI((x) => (x + d + bottles.length) % bottles.length);

  return (
    <section aria-roledescription="carousel" className="mx-auto mt-4 max-w-[760px] text-center lg:mt-0">
      <div className="flex items-center justify-center gap-4">
        <h2 className="font-display text-[26px] tracking-[0.04em] text-white sm:text-[30px] lg:text-[clamp(20px,3.4vh,30px)]">{b.serial}</h2>
        <span className="rounded-full border border-[#6d625a] px-3 py-1 text-[10px] tracking-[0.1em] text-cream uppercase">{tc("my")}</span>
      </div>
      {many && (
        <p className="mt-2 text-[11px] text-mute" aria-live="polite">
          {t("counter", { current: i + 1, total: bottles.length })}
        </p>
      )}

      <div className="relative mt-4 flex items-center justify-center">
        {many && (
          <button type="button" onClick={() => go(-1)} aria-label={t("prev")} className="absolute left-0 p-3 text-copper hover:text-white sm:left-8">
            <ChevronLeft className="size-9" strokeWidth={1} />
          </button>
        )}
        <Image
          src="/design/bottle-front.jpg"
          alt={`ONCE ${b.serial}`}
          width={400}
          height={428}
          priority
          className={compact ? "h-[300px] w-auto sm:h-[400px] lg:h-[clamp(130px,28vh,340px)]" : "h-[300px] w-auto sm:h-[400px] lg:h-[clamp(150px,36vh,400px)]"}
        />
        {many && (
          <button type="button" onClick={() => go(1)} aria-label={t("next")} className="absolute right-0 p-3 text-copper hover:text-white sm:right-8">
            <ChevronRight className="size-9" strokeWidth={1} />
          </button>
        )}
      </div>

      <dl className="mx-auto mt-8 lg:mt-[clamp(12px,3.56vh,32px)] grid max-w-[560px] grid-cols-3 text-center">
        {[
          [t("seriesBatch"), `${b.series} · ${b.batch}`],
          [t("claimedOn"), b.claimedOn],
          [t("location"), location],
        ].map(([label, value], k) => (
          <div key={label} className={k > 0 ? "border-l border-[#3b332c] px-3" : "px-3"}>
            <dt className="text-[10px] tracking-[0.1em] text-mute uppercase sm:text-[11px]">{label}</dt>
            <dd className="mt-2 text-[13px] text-cream sm:text-[15px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] flex flex-wrap justify-center gap-5 lg:gap-[clamp(8px,2.22vh,20px)]">
        <SmallLink href={`/my-bottles/${b.serial}`} className="min-w-[180px]">
          {t("openPassport")}
        </SmallLink>
        <SmallLink href={`/my-bottles/${b.serial}/transfer`} className="min-w-[180px]">
          <ArrowLeftRight className="size-3.5" strokeWidth={1.5} />
          {t("transfer")}
        </SmallLink>
      </div>
    </section>
  );
}
