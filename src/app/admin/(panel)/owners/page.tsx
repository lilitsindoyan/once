import Link from "next/link";
import { countryName } from "@/lib/capitals";
import { listOwnerEntries } from "@/server/admin/content";
import { pageAdmin } from "@/server/admin/page";
import { ownerHiddenAction } from "../../actions";
import { AButton, Flash, fmtDate, PageHeader, Table } from "@/components/admin/kit";

export const metadata = { title: "Bottle Owners" };

/** ToR 5.4 — hide individual entries from the public Bottle Owners page. */
export default async function OwnersAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await pageAdmin();
  const sp = await searchParams;
  const rows = await listOwnerEntries();

  return (
    <>
      <PageHeader title="Bottle Owners page" sub="Current owners who chose to show their name. Hidden entries stay hidden until shown again." />
      <Flash ok={sp.ok} err={sp.err} />
      <Table head={["Name", "Country", "Serial", "Owner since", "Public", ""]}>
        {rows.length === 0 && (
          <tr>
            <td colSpan={6} className="text-[var(--admin-mute)]">
              No named owners yet.
            </td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.id} className={r.hiddenByAdmin ? "opacity-60" : ""}>
            <td>
              <Link href={`/admin/customers/${r.userId}`} className="hover:underline">
                {r.user.firstName} {r.user.lastName}
              </Link>
            </td>
            <td>{countryName(r.user.country, "en")}</td>
            <td className="font-mono">{r.bottle.serial}</td>
            <td>{fmtDate(r.startedAt)}</td>
            <td>{r.hiddenByAdmin ? "Hidden" : r.user.status === "ACTIVE" ? "Shown" : "Not shown (account not active)"}</td>
            <td>
              <form action={ownerHiddenAction}>
                <input type="hidden" name="periodId" value={r.id} />
                <input type="hidden" name="hidden" value={r.hiddenByAdmin ? "0" : "1"} />
                <AButton type="submit" variant={r.hiddenByAdmin ? "secondary" : "danger"}>
                  {r.hiddenByAdmin ? "Show" : "Hide"}
                </AButton>
              </form>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
