import en from "../../../../../messages/en.json";
import hy from "../../../../../messages/hy.json";
import ru from "../../../../../messages/ru.json";
import { db } from "@/lib/db";
import { pageAdmin } from "@/server/admin/page";
import { languageStringAction } from "../../actions";
import { AButton, AInput, ATextarea, Flash, PageHeader } from "@/components/admin/kit";

export const metadata = { title: "Language strings" };

type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") acc[key] = v;
    else Object.assign(acc, flatten(v, key));
    return acc;
  }, {});
}

const BUNDLED = { hy: flatten(hy as Tree), en: flatten(en as Tree), ru: flatten(ru as Tree) };
const LOCALES = ["hy", "en", "ru"] as const;

/**
 * ToR 5.4 — Armenian, English and Russian values of every UI label.
 * An empty field uses the bundled text (shown greyed); a saved value overrides it.
 */
export default async function StringsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; err?: string }> }) {
  await pageAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim().toLowerCase() ?? "";
  const overrides = await db.languageString.findMany();
  const over = (key: string, l: string) => overrides.find((o) => o.key === key && o.locale === l)?.value ?? "";

  const keys = Object.keys(BUNDLED.en).filter(
    (k) => !q || k.toLowerCase().includes(q) || LOCALES.some((l) => (BUNDLED[l][k] ?? "").toLowerCase().includes(q)),
  );

  return (
    <>
      <PageHeader title="Language strings" sub={`${keys.length} labels. Leave a field empty to use the default text.`} />
      <Flash ok={sp.ok} err={sp.err} />
      <form className="mb-4 flex gap-2">
        <AInput name="q" defaultValue={sp.q} placeholder="Search key or text" className="w-80" />
        <AButton type="submit" variant="secondary">
          Search
        </AButton>
      </form>
      <div className="grid gap-3">
        {keys.map((key) => (
          <form key={key} action={languageStringAction} className="rounded-lg border border-[var(--admin-border)] bg-white p-3">
            <input type="hidden" name="key" value={key} />
            <input type="hidden" name="q" value={sp.q ?? ""} />
            <div className="mb-2 flex items-center justify-between gap-2">
              <code className="text-xs text-[var(--admin-mute)]">{key}</code>
              <AButton type="submit" variant="secondary" className="h-7 px-3 text-xs">
                Save
              </AButton>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {LOCALES.map((l) => {
                const long = (BUNDLED.en[key] ?? "").length > 60;
                const props = { name: l, defaultValue: over(key, l), placeholder: BUNDLED[l][key] ?? "", "aria-label": `${key} ${l}` };
                return (
                  <div key={l}>
                    <span className="mb-1 block text-[10px] font-semibold text-[var(--admin-mute)] uppercase">{l}</span>
                    {long ? <ATextarea rows={2} {...props} className="text-xs" /> : <AInput {...props} className="text-xs" />}
                  </div>
                );
              })}
            </div>
          </form>
        ))}
      </div>
    </>
  );
}
