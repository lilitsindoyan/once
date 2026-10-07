import { ArrowLeftRight, ArrowRight, ScanLine } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { countryName } from "@/lib/capitals";
import { listMyBottles } from "@/server/bottles";
import { listPendingInvites } from "@/server/transfer";
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
  const [bottles, invites] = await Promise.all([listMyBottles(user.id), listPendingInvites(user)]);

  // Nothing owned yet but a bottle is waiting: go straight to the accept flow.
  if (bottles.length === 0 && invites.length > 0) redirect({ href: `/transfers/${invites[0].id}`, locale });

  if (bottles.length === 0) {
    return (
      <div className="mx-auto flex max-w-[460px] flex-col items-center pt-10 lg:pt-[clamp(16px,4.44vh,40px)] text-center">
        <Eyebrow className="max-w-[300px] leading-[1.8]">{t("emptyEyebrow")}</Eyebrow>
        <h1 className="mt-5 lg:mt-[clamp(8px,2.22vh,20px)] font-display text-[34px] text-white sm:text-[40px]">{t("emptyTitle")}</h1>
        <p className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] max-w-[360px] text-[13px] leading-relaxed tracking-[0.03em] text-cream-2">{t("emptyText")}</p>
        <PrimaryLink href="/claim" className="mt-16 lg:mt-[clamp(25px,7.11vh,64px)] max-w-[460px]">
          <span className="inline-flex items-center gap-4">
            <ScanLine className="size-5" strokeWidth={1.4} />
            {t("claimFirst")}
          </span>
        </PrimaryLink>
        <hr className="mt-9 lg:mt-[clamp(14px,4.0vh,36px)] w-full border-[#2e2722]" />
        <p className="mt-9 lg:mt-[clamp(14px,4.0vh,36px)] text-[11px] text-cream uppercase">{tc("noBottleYet")}</p>
        <a href={process.env.NEXT_PUBLIC_SITE_URL ?? "/"} className="mt-1 text-[12px] text-copper underline underline-offset-4">
          {tc("learnMore")}
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-6 lg:gap-[clamp(9px,2.67vh,24px)]">
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

      {invites.length > 0 && (
        <Link
          href={`/transfers/${invites[0].id}`}
          className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border border-copper/60 bg-copper/10 px-6 py-4 transition hover:bg-copper/15 lg:mt-[clamp(8px,2vh,24px)] lg:py-[clamp(8px,1.6vh,16px)]"
        >
          <ArrowLeftRight className="size-5 shrink-0 text-copper" strokeWidth={1.4} />
          <span className="flex-1">
            <span className="block text-[13px] tracking-[0.06em] text-white uppercase">{t("inviteTitle")}</span>
            <span className="block text-[12px] text-cream-2">{t("inviteText", { serial: invites[0].bottle.serial })}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-[12px] tracking-[0.1em] text-copper uppercase">
            {t("inviteCta")}
            <ArrowRight className="size-4" strokeWidth={1.4} />
          </span>
        </Link>
      )}

      <BottleCarousel
        bottles={bottles.map((b) => ({
          serial: b.serial,
          series: b.series,
          batch: b.batch,
          claimedOn: b.claimedAt ? format.dateTime(b.claimedAt, { day: "numeric", month: "short", year: "numeric" }) : "—",
        }))}
        location={countryName(user.country, locale)}
        compact={invites.length > 0}
      />
    </>
  );
}
