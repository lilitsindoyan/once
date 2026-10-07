import { countryName, countryOptions } from "@/lib/capitals";
import { listPins } from "@/server/admin/content";
import { pageAdmin } from "@/server/admin/page";
import { pinAction } from "../../actions";
import { AButton, AInput, ALabel, ASelect, Flash, PageHeader, Panel, Table } from "@/components/admin/kit";

export const metadata = { title: "Map pins" };

/** ToR 5.4 — pins are added automatically on capitals; admin can add, move or hide them. */
export default async function MapAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await pageAdmin();
  const sp = await searchParams;
  const pins = await listPins();

  return (
    <>
      <PageHeader title="World map pins" sub="One pin per country, on its capital. Added automatically when a bottle is claimed or accepted from a new country." />
      <Flash ok={sp.ok} err={sp.err} />

      <Table head={["Country", "Latitude", "Longitude", "Visible", "Added", "Owners now", ""]}>
        {pins.length === 0 && (
          <tr>
            <td colSpan={7} className="text-[var(--admin-mute)]">
              No pins yet.
            </td>
          </tr>
        )}
        {pins.map((p) => (
          <tr key={p.id}>
            <td className="font-medium">{countryName(p.countryCode, "en")}</td>
            <td colSpan={3}>
              <form action={pinAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="countryCode" value={p.countryCode} />
                <AInput name="lat" type="number" step="0.0001" min={-90} max={90} defaultValue={p.lat} className="w-28" aria-label="Latitude" />
                <AInput name="lng" type="number" step="0.0001" min={-180} max={180} defaultValue={p.lng} className="w-28" aria-label="Longitude" />
                <ASelect name="visible" defaultValue={p.visible ? "1" : "0"} className="w-28" aria-label="Visible">
                  <option value="1">Shown</option>
                  <option value="0">Hidden</option>
                </ASelect>
                <AButton type="submit" variant="secondary">
                  Save
                </AButton>
              </form>
            </td>
            <td>{p.source === "AUTO" ? "Automatic" : "Manual"}</td>
            <td className="tabular-nums">{p.owners}</td>
            <td />
          </tr>
        ))}
      </Table>

      <Panel title="Add a pin" className="mt-8 max-w-xl">
        <form action={pinAction} className="grid gap-3">
          <input type="hidden" name="visible" value="1" />
          <ALabel label="Country" hint="Placed on the capital. Adjust the coordinates afterwards if needed.">
            <ASelect name="countryCode" required defaultValue="">
              <option value="" disabled>
                Select a country
              </option>
              {countryOptions("en").map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </ASelect>
          </ALabel>
          <div>
            <AButton type="submit">Add pin</AButton>
          </div>
        </form>
      </Panel>
    </>
  );
}
