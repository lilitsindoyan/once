import { ArrowLeftRight } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AppError } from "@/lib/errors";
import { countryName } from "@/lib/capitals";
import { getPassport } from "@/server/bottles";
import { pageUser } from "@/server/guard";
import { Eyebrow, RuledRows } from "@/components/portal/kit";
import { SplitScreen } from "@/components/portal/split-screen";
import { PassportTabs } from "./passport-tabs";

export async function generateMetadata() {
  const t = await getTranslations("passport");
  return { title: t("title") };
}

/** Bottle passport — design frame 215. Current owner only; the hidden code is never shown (ToR 4.3). */
export default async function PassportPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const user = await pageUser(`/my-bottles/${serial}`);
  const t = await getTranslations("passport");
  const tb = await getTranslations("bottles");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const locale = await getLocale();

  const passport = await getPassport(user, serial).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  });
  const date = (d: Date | null) => (d ? format.dateTime(d, { day: "numeric", month: "short", year: "numeric" }) : "—");

  const overview = (
    <RuledRows
      rows={[
        [t("seriesBatch"), `${passport.series} · ${passport.batch}`],
        [t("productionDate"), date(passport.productionDate)],
        [t("claimDate"), date(passport.claimedAt)],
        [
          t("status"),
          <span key="s" className="flex items-center gap-4">
            {t("statusMine")}
            <Link
              href={`/my-bottles/${passport.serial}/transfer`}
              className="inline-flex items-center gap-2 bg-[#3a3430] px-3 py-1.5 text-[12px] text-white hover:bg-[#4a423d]"
            >
              <ArrowLeftRight className="size-3.5" strokeWidth={1.5} />
              {tb("transfer")}
            </Link>
          </span>,
        ],
        [t("currentOwner"), `${user.firstName} ${user.lastName}`],
        [t("ownerCountry"), countryName(user.country, locale).toUpperCase()],
        ...passport.fields
          .filter((f) => f.value)
          .map((f) => [f.label[locale] || f.label.en || f.key, <span key={f.key} className="whitespace-pre-line">{f.value}</span>] as [string, React.ReactNode]),
      ]}
    />
  );

  const history = (
    <ol className="relative grid max-w-[420px] gap-7 lg:gap-[clamp(11px,3.11vh,28px)] border-l border-copper/40 pl-7">
      {passport.history.map((h, i) => (
        <li key={i} className="relative">
          <span className="absolute top-1.5 -left-[33px] size-2.5 rounded-full border border-copper bg-black" aria-hidden />
          <p className="text-[12px] tracking-[0.04em] text-copper-2 uppercase">
            {date(h.from)} – {h.to ? date(h.to) : tc("present")}
          </p>
          <p className="mt-1 text-[15px] text-white">
            {h.name ?? tc("anonymousOwner")}
            {h.isYou && <span className="ml-2 text-[12px] text-copper">({t("you")})</span>}
          </p>
        </li>
      ))}
    </ol>
  );

  return (
    <SplitScreen image="closeup" back={{ href: "/my-bottles" }}>
      <div className="lg:pt-8">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-display text-[34px] tracking-[0.03em] text-white sm:text-[40px]">{passport.serial}</h1>
        <p className="mt-3 text-[11px] tracking-[0.3em] text-copper uppercase">{t("subtitle")}</p>
        <PassportTabs labels={{ overview: t("tabOverview"), history: t("tabHistory") }} overview={overview} history={history} />
      </div>
    </SplitScreen>
  );
}
