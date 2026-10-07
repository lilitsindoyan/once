import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMyBottles } from "@/server/bottles";
import { pageUser } from "@/server/guard";
import { Card, linkButton, PageTitle } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

export async function generateMetadata() {
  const t = await getTranslations("bottles");
  return { title: t("title") };
}

/** Flow 3 — only the bottles the user owns right now. */
export default async function MyBottlesPage() {
  const user = await pageUser("/my-bottles");
  const t = await getTranslations("bottles");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const bottles = await listMyBottles(user.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle eyebrow={`${user.firstName} ${user.lastName}`}>{t("title")}</PageTitle>
        <div className="mb-10 flex gap-6 text-sm">
          <Link href="/profile" className="text-copper hover:underline">
            {tc("profile")}
          </Link>
          <LogoutButton label={tc("logout")} />
        </div>
      </div>

      {bottles.length === 0 ? (
        <Card className="text-center">
          <p className="mb-6 text-cream">{t("empty")}</p>
          <Link href="/claim" className={linkButton}>
            {t("claimFirst")}
          </Link>
        </Card>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {bottles.map((b) => (
              <li key={b.serial}>
                <Card className="flex h-full flex-col">
                  <p className="font-display text-3xl text-cream">{b.serial}</p>
                  <dl className="mt-4 grid gap-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-mute">{t("series")}:</dt>
                      <dd className="text-cream">
                        {b.series} · {b.batch}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-mute">{t("claimedOn")}:</dt>
                      <dd className="text-cream">{b.claimedAt ? format.dateTime(b.claimedAt, { dateStyle: "long" }) : "—"}</dd>
                    </div>
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-3 pt-2 sm:mt-auto">
                    <Link href={`/my-bottles/${b.serial}`} className={linkButton}>
                      {t("openPassport")}
                    </Link>
                    <Link
                      href={`/my-bottles/${b.serial}/transfer`}
                      className="inline-flex min-h-[46px] items-center px-2 font-serif text-lg text-copper hover:underline"
                    >
                      {t("transfer")}
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Link href="/claim" className={linkButton}>
              {t("claimAnother")}
            </Link>
          </div>
        </>
      )}
    </>
  );
}
