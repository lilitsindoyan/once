import Link from "next/link";
import { countryName, countryOptions } from "@/lib/capitals";
import { listCustomers } from "@/server/admin/customers";
import { pageAdmin } from "@/server/admin/page";
import { AButton, AInput, ASelect, Badge, Download, fmtDate, PageHeader, Pager, Table } from "@/components/admin/kit";
import type { AccountStatus } from "@prisma/client";

export const metadata = { title: "Customers" };

const STATUSES: AccountStatus[] = ["ACTIVE", "CLOSED", "SUSPENDED"];

/** ToR 5.3 — customer list with search, filters and CSV export. */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; country?: string; page?: string }>;
}) {
  await pageAdmin();
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as AccountStatus) ? (sp.status as AccountStatus) : undefined;
  const country = sp.country && sp.country.length === 2 ? sp.country : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await listCustomers({ q: sp.q, status, country, page });
  const href = (p: number) =>
    `/admin/customers?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(status ? { status } : {}), ...(country ? { country } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Customers"
        sub={`${data.total} accounts`}
        actions={
          <>
            <Download href="/api/admin/customers/export">Export customers (CSV)</Download>
            <Download href="/api/admin/ownership/export">Export ownership (CSV)</Download>
          </>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <AInput name="q" defaultValue={sp.q} placeholder="Name or email" className="w-64" />
        <ASelect name="status" defaultValue={status ?? ""} className="w-40">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </ASelect>
        <ASelect name="country" defaultValue={country ?? ""} className="w-52">
          <option value="">All countries</option>
          {countryOptions("en").map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </ASelect>
        <AButton type="submit" variant="secondary">
          Filter
        </AButton>
      </form>

      <Table head={["Name", "Email", "Country", "Status", "Bottles owned", "Registered"]}>
        {data.rows.length === 0 && (
          <tr>
            <td colSpan={6} className="text-[var(--admin-mute)]">
              No customers match.
            </td>
          </tr>
        )}
        {data.rows.map((u) => (
          <tr key={u.id}>
            <td>
              <Link href={`/admin/customers/${u.id}`} className="font-medium text-[var(--admin-accent)] hover:underline">
                {u.firstName} {u.lastName}
              </Link>
            </td>
            <td>{u.email}</td>
            <td>{countryName(u.country, "en")}</td>
            <td>
              <Badge value={u.status} />
            </td>
            <td className="tabular-nums">{u._count.bottles}</td>
            <td>{fmtDate(u.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={data.page} pages={data.pages} href={href} />
    </>
  );
}
