import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth";
import { LanguageSwitcher } from "./language-switcher";

/** Header from Figma frame 108: logo left, Claim Your Bottle + user icon right. */
export async function SiteHeader() {
  const t = await getTranslations("common");
  const user = await getCurrentUser();

  return (
    <header className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-12 sm:py-10">
      <Link href="/" aria-label="ONCE" className="shrink-0">
        <Image src="/once-logo.svg" alt="ONCE" width={162} height={35} priority className="h-6 w-auto sm:h-[35px]" />
      </Link>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-6">
        <Link href="/owners" className="font-serif text-base text-cream hover:text-white sm:text-lg">
          {t("owners")}
        </Link>
        <Link
          href="/claim"
          className="border border-copper-border px-3 py-2 font-serif text-base text-white hover:bg-copper/15 sm:px-[18px] sm:text-lg"
        >
          {t("claimYourBottle")}
        </Link>
        <Link href={user ? "/my-bottles" : "/login"} aria-label={user ? t("myBottles") : t("login")} title={user ? t("myBottles") : t("login")}>
          <Image src="/icon-user.svg" alt="" width={32} height={32} />
        </Link>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
