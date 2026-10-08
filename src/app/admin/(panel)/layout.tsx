import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/server/admin/auth";
import { unreadMessageCount } from "@/server/admin/messages";
import { logoutAction } from "../actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/series", label: "Series" },
  { href: "/admin/bottles", label: "Bottles" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/owners", label: "Bottle Owners" },
  { href: "/admin/map", label: "Map pins" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/strings", label: "Language strings" },
  { href: "/admin/account", label: "My account" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const unread = await unreadMessageCount();

  return (
    <div className="md:flex">
      <aside className="border-b border-[var(--admin-border)] bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-3 p-4 md:block">
          <Link href="/admin" className="inline-flex items-center gap-2 rounded bg-black px-3 py-2">
            <Image src="/once-logo.svg" alt="ONCE" width={81} height={17} />
          </Link>
          <p className="text-xs text-[var(--admin-mute)] md:mt-3">{admin.name}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-zinc-700 hover:bg-zinc-100"
            >
              {n.label}
              {n.href === "/admin/messages" && unread > 0 && (
                <span className="ml-2 rounded-full bg-[var(--admin-accent)] px-1.5 py-0.5 text-[11px] text-white">{unread}</span>
              )}
            </Link>
          ))}
          <form action={logoutAction}>
            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100">Log out</button>
          </form>
        </nav>
        {!admin.totpEnabled && (
          <Link href="/admin/account" className="m-3 hidden rounded-md bg-amber-50 p-3 text-xs text-amber-900 md:block">
            Two-factor authentication is off. Turn it on →
          </Link>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
