import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { countryName } from "@/lib/capitals";
import { Link } from "@/i18n/navigation";
import { LanguageMenu } from "./language-menu";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "/";

export function initials(first: string, last: string) {
  return `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase();
}

/**
 * Top-right cluster from the design: Visit ONCE.com · language · name, country and initials.
 * Logged-out visitors only see the language menu (login screens).
 * The notification bell from the design is left out: v1.2 sends every notification by email.
 */
export async function TopBarActions({ locale }: { locale: string }) {
  const t = await getTranslations("common");
  const user = await getCurrentUser();

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {user && (
        <a
          href={SITE_URL}
          className="hidden items-center gap-2 rounded-full border border-copper-border px-5 py-2 text-[12px] text-white hover:bg-copper/10 md:inline-flex"
        >
          {t("visitSite")}
          <ExternalLink className="size-3.5" strokeWidth={1.5} />
        </a>
      )}
      {user && <span className="hidden h-6 w-px bg-[#3b332c] md:block" aria-hidden />}
      <LanguageMenu />
      {user && (
        <>
          <span className="hidden h-6 w-px bg-[#3b332c] sm:block" aria-hidden />
          <Link href="/profile" className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-[12px] font-semibold text-cream">
                {user.firstName} {user.lastName}
              </span>
              <span className="block text-[11px] text-mute">{countryName(user.country, locale)}</span>
            </span>
            <span className="grid size-10 place-items-center rounded-full border border-[#6d625a] text-[12px] font-semibold text-cream">
              {initials(user.firstName, user.lastName)}
            </span>
          </Link>
        </>
      )}
    </div>
  );
}
