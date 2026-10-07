import { analytics } from "@/server/admin/content";
import { pageAdmin } from "@/server/admin/page";
import { countryName } from "@/lib/capitals";
import { PageHeader, Panel, Table } from "@/components/admin/kit";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Panel>
      <p className="text-xs font-medium text-[var(--admin-mute)] uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--admin-mute)]">{sub}</p>}
    </Panel>
  );
}

/** ToR 5.5 — basic analytics. */
export default async function Dashboard() {
  await pageAdmin();
  const a = await analytics();
  const pct = a.bottles.total ? Math.round((a.bottles.claimed / a.bottles.total) * 100) : 0;

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Bottles claimed" value={`${a.bottles.claimed} / ${a.bottles.total}`} sub={`${pct}% of issued bottles`} />
        <Stat label="New registrations" value={a.registrations.week} sub={`${a.registrations.day} today · ${a.registrations.month} in 30 days`} />
        <Stat label="Transfers completed" value={a.transfers.completed} sub={`${a.transfers.sent} sent in total`} />
        <Stat label="Transfers pending" value={a.transfers.pending} sub="Waiting for the recipient" />
      </div>
      <div className="mt-6 max-w-xl">
        <h2 className="mb-3 text-sm font-semibold text-[var(--admin-mute)] uppercase">Top countries by owners</h2>
        <Table head={["Country", "Owners"]}>
          {a.topCountries.length === 0 && (
            <tr>
              <td colSpan={2} className="text-[var(--admin-mute)]">
                No owners yet.
              </td>
            </tr>
          )}
          {a.topCountries.map((c) => (
            <tr key={c.country}>
              <td>{countryName(c.country, "en")}</td>
              <td className="tabular-nums">{c.owners}</td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}
