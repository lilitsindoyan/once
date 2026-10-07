import { ArrowRight, ScanLine } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { countryName } from "@/lib/capitals";
import { listMyBottles } from "@/server/bottles";
import { pageUser } from "@/server/guard";
import { Eyebrow, PageHeading, PrimaryLink } from "@/components/portal/kit";
import { BottleCarousel } from "./bottle-carousel";

export async function generateMetadata() {
  const t = await getTranslations("bottles");
  return { title: t("title") };
}

/** Flow 3 — design frames 243 / 242 (bottles) and 207 (empty state). */
export default async function MyBottlesPage() {
  const user = await pageUser("/my-bottles");
  const t = await getTranslations("bottles");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const locale = await getLocale();
  const bottles = await listMyBottles(user.id);

  if (bottles.length === 0) {
    return (
      <div className="mx-auto flex max-w-[460px] flex-col items-center pt-10 text-center lg:pt-20">
        <Eyebrow className="max-w-[300px] leading-[1.8]">{t("emptyEyebrow")}</Eyebrow>
        <h1 className="mt-5 font-display text-[34px] text-white sm:text-[40px]">{t("emptyTitle")}</h1>
        <p className="mt-10 max-w-[360px] text-[13px] leading-relaxed tracking-[0.03em] text-cream-2">{t("emptyText")}</p>
        <PrimaryLink href="/claim" className="mt-16 max-w-[460px]">
          <span className="inline-flex items-center gap-4">
            <ScanLine className="size-5" strokeWidth={1.4} />
            {t("claimFirst")}
          </span>
        </PrimaryLink>
        <hr className="mt-9 w-full border-[#2e2722]" />
        <p className="mt-9 text-[11px] text-cream uppercase">{tc("noBottleYet")}</p>
        <a href={process.env.NEXT_PUBLIC_SITE_URL ?? "/"} className="mt-1 text-[12px] text-copper underline underline-offset-4">
          {tc("learnMore")}
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <PageHeading title={t("title")} subtitle={t("subtitle")} />
        <Link
          href="/claim"
          className="flex min-h-[62px] w-full items-center gap-4 bg-[#2a221c]/90 px-6 text-[15px] text-white transition hover:bg-[#3a2e25] sm:w-[300px]"
        >
          <ScanLine className="size-5 text-copper" strokeWidth={1.4} />
          <span className="flex-1">{t("claimYourBottle")}</span>
          <ArrowRight className="size-5" strokeWidth={1.4} />
        </Link>
      </div>

      <BottleCarousel
        bottles={bottles.map((b) => ({
          serial: b.serial,
          series: b.series,
          batch: b.batch,
          claimedOn: b.claimedAt ? format.dateTime(b.claimedAt, { day: "numeric", month: "short", year: "numeric" }) : "—",
        }))}
        location={countryName(user.country, locale)}
      />
    </>
  );
}
