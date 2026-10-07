import Link from "next/link";
import { listSeries, MAX_SERIES_QUANTITY } from "@/server/admin/series";
import { pageAdmin } from "@/server/admin/page";
import { createSeriesAction } from "../../actions";
import { AButton, AInput, ALabel, ATextarea, Download, Flash, fmtDate, PageHeader, Panel, Table } from "@/components/admin/kit";

export const metadata = { title: "Series" };

const DEFAULT_TEMPLATE = `origin | Origin | Ծագում | Происхождение
age | Age | Տարիք | Выдержка
cask | Cask | Տակառ | Бочка
tasting_notes | Tasting notes | Համային նոտաներ | Дегустационные заметки | longtext`;

/** ToR 5.2.1 — series, serial + hidden code generation, exports, general QR code. */
export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const admin = await pageAdmin();
  const sp = await searchParams;
  const series = await listSeries();

  return (
    <>
      <PageHeader
        title="Bottle series"
        sub="Each bottle gets a non-sequential serial number and a hidden code."
        actions={
          <Download href="/api/admin/qr">Download general QR code</Download>
        }
      />
      <Flash ok={sp.ok} err={sp.err} />

      <Table head={["Series", "Batch", "Bottles", "Unclaimed", "Owned", "In transfer", "Production", "Created", ""]}>
        {series.length === 0 && (
          <tr>
            <td colSpan={9} className="text-[var(--admin-mute)]">
              No series yet.
            </td>
          </tr>
        )}
        {series.map((s) => (
          <tr key={s.id}>
            <td className="font-medium">
              <Link href={`/admin/series/${s.id}`} className="hover:underline">
                {s.name}
              </Link>
            </td>
            <td>{s.batchNumber}</td>
            <td className="tabular-nums">{s.quantity}</td>
            <td className="tabular-nums">{s.counts.UNCLAIMED ?? 0}</td>
            <td className="tabular-nums">{s.counts.OWNED ?? 0}</td>
            <td className="tabular-nums">{s.counts.IN_TRANSFER ?? 0}</td>
            <td>{fmtDate(s.productionDate)}</td>
            <td>{fmtDate(s.createdAt)}</td>
            <td>
              <Download href={`/api/admin/series/${s.id}/export`} variant="text">
                Export codes (CSV)
              </Download>
            </td>
          </tr>
        ))}
      </Table>

      {admin.role === "SUPER_ADMIN" && (
        <Panel title="Create a series" className="mt-8 max-w-3xl">
          <form action={createSeriesAction} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ALabel label="Series name">
                <AInput name="name" required maxLength={120} placeholder="Series I · 40 years" />
              </ALabel>
              <ALabel label="Batch number">
                <AInput name="batchNumber" required maxLength={60} placeholder="B-001" />
              </ALabel>
              <ALabel label="Quantity" hint={`1 – ${MAX_SERIES_QUANTITY.toLocaleString("en")} bottles`}>
                <AInput name="quantity" type="number" min={1} max={MAX_SERIES_QUANTITY} required />
              </ALabel>
              <ALabel label="Production date">
                <AInput name="productionDate" type="date" />
              </ALabel>
            </div>
            <ALabel
              label="Passport fields"
              hint="One field per line: key | English | Armenian | Russian | type (text, date or longtext). Values are filled per bottle."
            >
              <ATextarea name="template" rows={6} defaultValue={DEFAULT_TEMPLATE} className="font-mono text-xs" />
            </ALabel>
            <div>
              <AButton type="submit">Create series and generate codes</AButton>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}
