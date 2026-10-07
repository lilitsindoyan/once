import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pageAdmin } from "@/server/admin/page";
import type { PassportField } from "@/server/bottles";
import { seriesDefaultsAction, updateTemplateAction } from "../../../actions";
import { AButton, AInput, ALabel, ALink, ATextarea, Download, Flash, fmtDate, PageHeader, Panel } from "@/components/admin/kit";

export const metadata = { title: "Series" };

const toLines = (t: PassportField[]) =>
  t.map((f) => [f.key, f.label.en, f.label.hy ?? "", f.label.ru ?? "", f.type ?? "text"].join(" | ")).join("\n");

export default async function SeriesDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const admin = await pageAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const series = await db.series.findUnique({ where: { id } });
  if (!series) notFound();

  return (
    <>
      <PageHeader
        title={series.name}
        sub={`Batch ${series.batchNumber} · ${series.quantity} bottles · produced ${fmtDate(series.productionDate)}`}
        actions={
          <>
            <ALink href={`/admin/bottles?seriesId=${series.id}`}>View bottles</ALink>
            <Download href={`/api/admin/series/${series.id}/export`} variant="primary">
              Export codes (CSV)
            </Download>
          </>
        }
      />
      <Flash ok={sp.ok} err={sp.err} />
      {(series.passportTemplate as PassportField[]).length > 0 && (
        <Panel title="Passport values for every bottle in this series" className="mb-6 max-w-3xl">
          <form action={seriesDefaultsAction} className="grid gap-4">
            <input type="hidden" name="seriesId" value={series.id} />
            {(series.passportTemplate as PassportField[]).map((f) => {
              const v = (series.passportDefaults as Record<string, string>)[f.key] ?? "";
              return (
                <ALabel key={f.key} label={f.label.en}>
                  {f.type === "longtext" ? (
                    <ATextarea name={`f_${f.key}`} rows={3} defaultValue={v} />
                  ) : (
                    <AInput name={`f_${f.key}`} type={f.type === "date" ? "date" : "text"} defaultValue={v} />
                  )}
                </ALabel>
              );
            })}
            <p className="text-xs text-[var(--admin-mute)]">A value set on an individual bottle replaces the series value for that bottle.</p>
            <div>
              <AButton type="submit">Save values</AButton>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Passport template" className="max-w-3xl">
        {admin.role === "SUPER_ADMIN" ? (
          <form action={updateTemplateAction} className="grid gap-4">
            <input type="hidden" name="seriesId" value={series.id} />
            <ALabel label="Fields" hint="key | English | Armenian | Russian | type (text, date or longtext)">
              <ATextarea name="template" rows={8} defaultValue={toLines(series.passportTemplate as PassportField[])} className="font-mono text-xs" />
            </ALabel>
            <div>
              <AButton type="submit">Save template</AButton>
            </div>
          </form>
        ) : (
          <pre className="text-xs whitespace-pre-wrap">{toLines(series.passportTemplate as PassportField[])}</pre>
        )}
      </Panel>
    </>
  );
}
