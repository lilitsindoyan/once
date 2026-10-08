import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { countryName } from "@/lib/capitals";
import { listOwners } from "@/server/owners";

export async function generateMetadata() {
  const t = await getTranslations("owners");
  return { title: t("title"), robots: { index: true } };
}

/** Public Bottle Owners page (ToR 3.1.4), in the landing's look; reached from the landing Map section. */
export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.slice(0, 80) ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const t = await getTranslations("owners");
  const tl = await getTranslations("landing");
  const locale = await getLocale();
  const format = await getFormatter();
  const data = await listOwners(q, page);

  const pageHref = (p: number) => ({ pathname: "/owners", query: { ...(q ? { q } : {}), page: String(p) } });

  return (
    <div className="mx-auto max-w-[1060px]">
      <Link href={{ pathname: "/", hash: "map" }} className="inline-flex items-center gap-2 text-[12px] tracking-[0.2em] text-copper uppercase hover:text-white">
        <ArrowLeft className="size-4" strokeWidth={1.2} />
        {tl("mapTitle")}
      </Link>
      <h1 className="mt-6 font-display text-[34px] leading-[1.1] break-words text-white sm:text-[60px]">{t("title")}</h1>
      <p className="mt-4 max-w-[480px] text-[13px] leading-[1.7] tracking-[0.06em] text-mute uppercase">{t("intro")}</p>

      <form role="search" className="mt-10 flex max-w-[520px] items-center gap-3 border-b border-[#6d625a] pb-3 focus-within:border-copper">
        <Search className="size-5 shrink-0 text-copper" strokeWidth={1.3} aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("search")}
          aria-label={t("search")}
          className="w-full border-0 bg-transparent p-0 text-[16px] text-white placeholder:text-mute focus:ring-0 focus:outline-none"
        />
      </form>

      {data.rows.length === 0 ? (
        <p className="mt-16 font-display text-[22px] text-cream">{t("empty")}</p>
      ) : (
        <ul className="mt-10 divide-y divide-[#2a2420] border-y border-[#2a2420]">
          <li aria-hidden className="hidden grid-cols-[1.4fr_1fr_1fr_0.9fr] gap-6 py-4 text-[11px] tracking-[0.2em] text-mute uppercase sm:grid">
            <span>{t("name")}</span>
            <span>{t("country")}</span>
            <span>{t("serial")}</span>
            <span>{t("since")}</span>
          </li>
          {data.rows.map((r) => (
            <li key={r.serial} className="grid grid-cols-2 gap-x-6 gap-y-1 py-5 sm:grid-cols-[1.4fr_1fr_1fr_0.9fr] sm:items-center">
              <span className="col-span-2 font-display text-[22px] text-white sm:col-span-1">{r.name}</span>
              <span className="text-[14px] text-cream-2">{countryName(r.country, locale)}</span>
              <span className="text-right font-display text-[17px] tracking-[0.04em] text-copper sm:text-left">{r.serial}</span>
              <span className="col-span-2 text-[13px] text-mute sm:col-span-1 sm:text-[14px] sm:text-cream-2">
                <span className="sm:hidden">{t("since")} · </span>
                {format.dateTime(r.since, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      )}

      {data.pages > 1 && (
        <nav className="mt-8 flex items-center justify-between text-[12px] tracking-[0.2em] uppercase">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex items-center gap-2 text-copper hover:text-white">
              <ArrowLeft className="size-4" strokeWidth={1.2} /> {t("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-mute">
            {page} / {data.pages}
          </span>
          {page < data.pages ? (
            <Link href={pageHref(page + 1)} className="inline-flex items-center gap-2 text-copper hover:text-white">
              {t("next")} <ArrowRight className="size-4" strokeWidth={1.2} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
