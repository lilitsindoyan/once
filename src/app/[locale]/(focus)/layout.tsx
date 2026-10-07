import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TopBarActions } from "@/components/portal/top-bar";

/** Full-screen frame for login, claim, passport, transfer and accept (design frames 233, 215, 216, 291). */
export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="min-h-screen bg-black">
      <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-12 sm:pt-9 sm:pb-6">
        <Link href="/my-bottles" aria-label="ONCE" className="shrink-0">
          <Image src="/once-logo.svg" alt="ONCE" width={150} height={32} priority className="h-6 w-auto sm:h-8" />
        </Link>
        <TopBarActions locale={locale} />
      </header>
      {children}
    </div>
  );
}
