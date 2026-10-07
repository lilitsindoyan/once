import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { countryName } from "@/lib/capitals";
import { listOwners } from "@/server/owners";
import { Card, Input, PageTitle } from "@/components/ui";

export async function generateMetadata() {
  const t = await getTranslations("owners");
  return { title: t("title"), robots: { index: true } };
}

/** Public Bottle Owners page (ToR 3.1.4). */
export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.slice(0, 80) ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const t = await getTranslations("owners");
  const locale = await getLocale();
  const format = await getFormatter();
  const data = await listOwners(q, page);

  const pageHref = (p: number) => ({ pathname: "/owners", query: { ...(q ? { q } : {}), page: String(p) } });

  return (
    <>
      <PageTitle eyebrow="ONCE">{t("title")}</PageTitle>
      <p className="-mt-6 mb-8 text-mute">{t("intro")}</p>

      <form className="mb-8" role="search">
        <Input type="search" name="q" defaultValue={q} placeholder={t("search")} aria-label={t("search")} />
      </form>

      <Card className="overflow-x-auto p-0 sm:p-0">
        {data.rows.length === 0 ? (
          <p className="p-8 text-center text-mute">{t("empty")}</p>
        ) : (
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-line text-xs tracking-[0.18em] text-mute uppercase">
                <th className="px-6 py-4 font-normal">{t("name")}</th>
                <th className="px-6 py-4 font-normal">{t("country")}</th>
                <th className="px-6 py-4 font-normal">{t("serial")}</th>
                <th className="px-6 py-4 font-normal">{t("since")}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.serial} className="border-b border-line/60 last:border-0">
                  <td className="px-6 py-4 font-serif text-lg text-cream">{r.name}</td>
                  <td className="px-6 py-4 text-cream">{countryName(r.country, locale)}</td>
                  <td className="px-6 py-4 font-mono text-sm text-copper">{r.serial}</td>
                  <td className="px-6 py-4 text-cream">{format.dateTime(r.since, { dateStyle: "medium" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {data.pages > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-copper hover:underline">
              ← {t("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-mute">
            {page} / {data.pages}
          </span>
          {page < data.pages ? (
            <Link href={pageHref(page + 1)} className="text-copper hover:underline">
              {t("next")} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
