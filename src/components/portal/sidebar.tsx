"use client";

import clsx from "clsx";
import { ArrowLeftRight, CircleUserRound, LogOut, ScanLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";

/** Round flask icon for "My Bottles" (matches the design's bottle glyph). */
function BottleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className} aria-hidden>
      <path d="M10 2.5h4M10.5 2.5v3.2M13.5 2.5v3.2" />
      <circle cx="12" cy="14" r="7.5" />
    </svg>
  );
}

const ITEMS = [
  { href: "/my-bottles", key: "myBottles", Icon: BottleIcon },
  { href: "/claim", key: "claim", Icon: ScanLine },
  { href: "/transfers", key: "transfers", Icon: ArrowLeftRight },
  { href: "/profile", key: "profile", Icon: CircleUserRound },
] as const;

/** Left navigation from the design (frames 243, 143). On phones it becomes a scrolling row under the header. */
export function Sidebar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await api("/api/auth/logout", {});
    router.replace("/login");
    router.refresh();
  };

  return (
    <nav aria-label={tc("menu")} className="flex h-full flex-col">
      <ul className="flex gap-1 overflow-x-auto px-4 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex items-center gap-3.5 px-4 py-[clamp(9px,1.6vh,14px)] text-[12px] tracking-[0.06em] whitespace-nowrap uppercase transition lg:px-8",
                  active ? "bg-[#1a1613] text-white" : "text-cream hover:text-white",
                )}
              >
                {active && <span className="absolute top-0 bottom-0 left-0 hidden w-0.5 bg-copper lg:block" aria-hidden />}
                <Icon className="size-[18px] shrink-0 text-copper" strokeWidth={1.4} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto hidden px-10 pb-[clamp(16px,4vh,40px)] lg:block">
        <p className="max-w-[110px] text-[10px] leading-[1.8] tracking-[0.3em] text-mute uppercase">{tc("worldHoldsOnce")}</p>
        <span className="mt-3 block h-px w-7 bg-copper/60" aria-hidden />
        <button
          type="button"
          onClick={logout}
          className="mt-[clamp(20px,6vh,64px)] flex items-center gap-3 text-[13px] tracking-[0.08em] text-cream hover:text-white"
        >
          <LogOut className="size-[18px] text-copper" strokeWidth={1.4} />
          {tc("logout")}
        </button>
      </div>
    </nav>
  );
}

export function MobileLogout() {
  const tc = useTranslations("common");
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await api("/api/auth/logout", {});
        router.replace("/login");
        router.refresh();
      }}
      className="flex items-center gap-2 text-[12px] text-cream lg:hidden"
    >
      <LogOut className="size-4 text-copper" strokeWidth={1.4} />
      {tc("logout")}
    </button>
  );
}
