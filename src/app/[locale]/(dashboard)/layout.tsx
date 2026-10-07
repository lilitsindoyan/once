import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MobileLogout, Sidebar } from "@/components/portal/sidebar";
import { TopBarActions } from "@/components/portal/top-bar";

/** Dashboard frame from the design: sidebar left, top bar right, copper glow behind (frames 243, 143, 212). */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");
  const locale = await getLocale();

  return (
    <div className="once-texture min-h-screen lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[260px_1fr] lg:overflow-hidden">
      <aside className="border-b border-[#1f1a16] lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-5 lg:block lg:px-12 lg:pt-[clamp(20px,4.5vh,40px)] lg:pb-[clamp(16px,4vh,48px)]">
          <Link href="/my-bottles" aria-label="ONCE">
            <Image src="/once-logo.svg" alt="ONCE" width={150} height={32} priority className="h-6 w-auto lg:h-8" />
          </Link>
          <p className="mt-[clamp(10px,2.5vh,24px)] hidden max-w-[180px] text-[10px] leading-[1.8] tracking-[0.3em] text-mute uppercase lg:block">
            {t("tagline")}
          </p>
          <div className="lg:hidden">
            <TopBarActions locale={locale} />
          </div>
        </div>
        <div className="pb-3 lg:flex lg:flex-1 lg:flex-col lg:pb-0">
          <Sidebar />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col lg:h-dvh">
        <header className="hidden shrink-0 justify-end px-12 pt-[clamp(14px,3.5vh,32px)] lg:flex">
          <div className="border-b border-[#2a241f] pb-[clamp(10px,2vh,20px)] pl-16">
            <TopBarActions locale={locale} />
          </div>
        </header>
        <main className="px-4 pt-8 pb-20 sm:px-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-14 lg:pt-[clamp(8px,2vh,24px)] lg:pb-[clamp(12px,3vh,32px)]">
          {children}
          <div className="mt-12 lg:hidden">
            <MobileLogout />
          </div>
        </main>
      </div>
    </div>
  );
}
