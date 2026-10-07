import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AppError } from "@/lib/errors";
import { getPassport } from "@/server/bottles";
import { pageUser } from "@/server/guard";
import { Card, KeyValue, linkButton, PageTitle } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("passport");
  return { title: t("title") };
}

/** Bottle passport — current owner only; the hidden code is never shown (ToR 4.3). */
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
  const date = (d: Date | null) => (d ? format.dateTime(d, { day: "2-digit", month: "short", year: "numeric" }) : "—");

  return (
    <>
      <Link href="/my-bottles" className="mb-6 inline-block text-sm text-copper hover:underline">
        ← {tb("title")}
      </Link>
      <PageTitle eyebrow={t("title")}>{passport.serial}</PageTitle>

      <div className="grid gap-8">
        <Card>
          <dl>
            <KeyValue label={t("serial")}>{passport.serial}</KeyValue>
            <KeyValue label={t("series")}>{passport.series}</KeyValue>
            <KeyValue label={t("batch")}>{passport.batch}</KeyValue>
            <KeyValue label={t("productionDate")}>{date(passport.productionDate)}</KeyValue>
            <KeyValue label={t("claimDate")}>{date(passport.claimedAt)}</KeyValue>
            {passport.fields
              .filter((f) => f.value)
              .map((f) => (
                <KeyValue key={f.key} label={f.label[locale] ?? f.label.en ?? f.key}>
                  <span className="whitespace-pre-line">{f.value}</span>
                </KeyValue>
              ))}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-6 font-display text-2xl text-cream">{t("history")}</h2>
          <ol className="relative grid gap-6 border-l border-copper/50 pl-6">
            {passport.history.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[29px] size-2.5 rounded-full border border-copper bg-ink" aria-hidden />
                <p className="text-sm text-mute">
                  {date(h.from)} – {h.to ? date(h.to) : tc("present")}
                </p>
                <p className="font-serif text-xl text-cream">
                  {h.name ?? tc("anonymousOwner")}
                  {h.isYou && <span className="ml-2 text-sm text-copper">({t("you")})</span>}
                </p>
              </li>
            ))}
          </ol>
        </Card>

        <div>
          <Link href={`/my-bottles/${passport.serial}/transfer`} className={linkButton}>
            {tb("transfer")}
          </Link>
        </div>
      </div>
    </>
  );
}
