import Link from "next/link";
import { db } from "@/lib/db";
import { listBottles } from "@/server/admin/bottles";
import { pageAdmin } from "@/server/admin/page";
import { AButton, AInput, ASelect, Badge, fmtDate, PageHeader, Pager, Table } from "@/components/admin/kit";
import type { BottleStatus } from "@prisma/client";

export const metadata = { title: "Bottles" };

const STATUSES: BottleStatus[] = ["UNCLAIMED", "OWNED", "IN_TRANSFER", "DEACTIVATED"];

/** ToR 5.2.1 — bottle list: serial, series, status, current owner. */
export default async function BottlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; seriesId?: string; page?: string }>;
}) {
  await pageAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as BottleStatus) ? (sp.status as BottleStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const [data, series] = await Promise.all([
    listBottles({ q: sp.q, status, seriesId: sp.seriesId || undefined, page }),
    db.series.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, batchNumber: true } }),
  ]);
  const href = (p: number) =>
    `/admin/bottles?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(status ? { status } : {}), ...(sp.seriesId ? { seriesId: sp.seriesId } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Bottles" sub={`${data.total} bottles`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <AInput name="q" defaultValue={sp.q} placeholder="Serial, owner email or last name" className="w-72" />
        <ASelect name="status" defaultValue={status ?? ""} className="w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </ASelect>
        <ASelect name="seriesId" defaultValue={sp.seriesId ?? ""} className="w-56">
          <option value="">All series</option>
          {series.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.batchNumber}
            </option>
          ))}
        </ASelect>
        <AButton type="submit" variant="secondary">
          Filter
        </AButton>
      </form>

      <Table head={["Serial", "Series", "Status", "Current owner", "Claimed"]}>
        {data.rows.length === 0 && (
          <tr>
            <td colSpan={5} className="text-[var(--admin-mute)]">
              No bottles match.
            </td>
          </tr>
        )}
        {data.rows.map((b) => (
          <tr key={b.id}>
            <td className="font-mono">
              <Link href={`/admin/bottles/${b.id}`} className="text-[var(--admin-accent)] hover:underline">
                {b.serial}
              </Link>
            </td>
            <td>
              {b.series.name} · {b.series.batchNumber}
            </td>
            <td>
              <Badge value={b.status} />
            </td>
            <td>
              {b.currentOwner ? (
                <Link href={`/admin/customers/${b.currentOwner.id}`} className="hover:underline">
                  {b.currentOwner.firstName} {b.currentOwner.lastName}
                  <span className="block text-xs text-[var(--admin-mute)]">{b.currentOwner.email}</span>
                </Link>
              ) : b.transfers[0] ? (
                <span className="text-xs text-[var(--admin-mute)]">→ {b.transfers[0].recipientEmail}</span>
              ) : (
                "—"
              )}
            </td>
            <td>{fmtDate(b.claimedAt)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={data.page} pages={data.pages} href={href} />
    </>
  );
}
