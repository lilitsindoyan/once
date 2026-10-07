import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Split screen from the design: bottle photo left with the brand line, content column right.
 * Images live in /public/design (placeholders until the originals are exported from Figma):
 *  - bottle-stand.jpg   "once 5 1"  (login, accept)
 *  - bottle-closeup.jpg "once 2 1"  (passport, transfer, claim)
 */
export async function SplitScreen({
  image,
  back,
  caption = true,
  children,
}: {
  image: "stand" | "closeup";
  back?: { href: string; label?: string };
  caption?: boolean;
  children: ReactNode;
}) {
  const t = await getTranslations("common");
  const src = image === "stand" ? "/design/bottle-stand.jpg" : "/design/bottle-closeup.jpg";

  return (
    <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100vh-110px)] lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-16 lg:pr-[90px]">
      <div className="relative h-[260px] overflow-hidden sm:h-[360px] lg:h-auto">
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={image === "stand" ? "object-contain object-center p-6 lg:p-12" : "object-cover object-center opacity-90"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black" />
        {back && (
          <Link
            href={back.href}
            className="absolute top-4 left-4 flex items-center gap-4 text-[11px] tracking-[0.14em] text-cream uppercase hover:text-white sm:left-12 lg:top-6"
          >
            <ArrowLeft className="size-4 text-copper" strokeWidth={1.4} />
            {back.label ?? t("backToHome")}
          </Link>
        )}
        {caption && (
          <div className="absolute bottom-10 left-12 hidden lg:block">
            <p className="max-w-[160px] font-display text-[26px] leading-[1.25] tracking-[0.3em] text-cream-2 uppercase">
              {t("moreThanSpirit")}
            </p>
            <span className="my-6 block h-px w-14 bg-cream-2/60" aria-hidden />
            <p className="max-w-[170px] text-[13px] leading-[1.9] tracking-[0.2em] text-cream-2 uppercase">{t("storyLivesOn")}</p>
          </div>
        )}
      </div>
      <div className="px-4 pt-8 pb-20 sm:px-12 lg:px-0 lg:pt-6">{children}</div>
    </div>
  );
}
