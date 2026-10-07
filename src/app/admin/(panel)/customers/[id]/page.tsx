import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { countryOptions } from "@/lib/capitals";
import { customerDetail } from "@/server/admin/customers";
import { pageAdmin } from "@/server/admin/page";
import { customerStatusAction, updateCustomerAction } from "../../../actions";
import { AButton, AInput, ALabel, ASelect, Badge, Flash, fmtDate, fmtDateTime, PageHeader, Panel, Table } from "@/components/admin/kit";

export const metadata = { title: "Customer" };

/** ToR 5.3 — profile, bottles now and in the past, transfers sent and received, account actions. */
export default async function CustomerDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  await pageAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const u = await customerDetail(id).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  });

  const statusButton = (status: string, label: string, variant: "secondary" | "danger" = "secondary") => (
    <form action={customerStatusAction}>
      <input type="hidden" name="userId" value={u.id} />
      <input type="hidden" name="status" value={status} />
      <AButton type="submit" variant={variant}>
        {label}
      </AButton>
    </form>
  );

  return (
    <>
      <PageHeader
        title={`${u.firstName} ${u.lastName}`}
        sub={
          <>
            {u.email} · registered {fmtDate(u.createdAt)} · <Badge value={u.status} />
            {u.closedAt && ` · closed ${fmtDate(u.closedAt)}`}
          </>
        }
      />
      <Flash ok={sp.ok} err={sp.err} />

      {u.sameEmail.length > 0 && (
        <div className="mb-6 rounded-md border border-[var(--admin-border)] bg-white p-3 text-sm">
          Other accounts with this email:{" "}
          {u.sameEmail.map((o, i) => (
            <span key={o.id}>
              {i > 0 && ", "}
              <Link href={`/admin/customers/${o.id}`} className="text-[var(--admin-accent)] hover:underline">
                {o.status.toLowerCase()} since {fmtDate(o.createdAt)}
              </Link>
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <form action={updateCustomerAction} className="grid gap-3">
            <input type="hidden" name="userId" value={u.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ALabel label="First name">
                <AInput name="firstName" defaultValue={u.firstName} required maxLength={80} />
              </ALabel>
              <ALabel label="Last name">
                <AInput name="lastName" defaultValue={u.lastName} required maxLength={80} />
              </ALabel>
            </div>
            <ALabel label="Email">
              <AInput name="email" type="email" defaultValue={u.email} required />
            </ALabel>
            <ALabel label="Country" hint="Sets the map pin for new claims. Users can't change it themselves.">
              <ASelect name="country" defaultValue={u.country}>
                {countryOptions("en").map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </ASelect>
            </ALabel>
            <div>
              <AButton type="submit">Save profile</AButton>
            </div>
          </form>
        </Panel>

        <Panel title="Account">
          <p className="mb-4 text-sm text-[var(--admin-mute)]">
            Suspended accounts can&apos;t log in. Closing needs the account to hold no bottles; closed accounts are never deleted.
          </p>
          <div className="flex flex-wrap gap-2">
            {u.status === "ACTIVE" && statusButton("SUSPENDED", "Suspend", "danger")}
            {u.status === "SUSPENDED" && statusButton("ACTIVE", "Unsuspend")}
            {u.status !== "CLOSED" && statusButton("CLOSED", "Close account", "danger")}
            {u.status === "CLOSED" && statusButton("ACTIVE", "Reopen account")}
          </div>
        </Panel>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-[var(--admin-mute)] uppercase">Bottles (now and in the past)</h2>
      <Table head={["Serial", "Series", "From", "To", "Shown as"]}>
        {u.periods.length === 0 && (
          <tr>
            <td colSpan={5} className="text-[var(--admin-mute)]">
              No bottles.
            </td>
          </tr>
        )}
        {u.periods.map((p) => (
          <tr key={p.id}>
            <td className="font-mono">
              <Link href={`/admin/bottles/${p.bottleId}`} className="text-[var(--admin-accent)] hover:underline">
                {p.bottle.serial}
              </Link>
            </td>
            <td>{p.bottle.series.name}</td>
            <td>{fmtDate(p.startedAt)}</td>
            <td>{p.endedAt ? fmtDate(p.endedAt) : <strong>owns now</strong>}</td>
            <td>{p.showName ? "Name" : "Anonymous"}</td>
          </tr>
        ))}
      </Table>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-[var(--admin-mute)] uppercase">Transfers</h2>
      <Table head={["Date", "Direction", "Bottle", "Other party", "Status"]}>
        {u.transfersSent.length + u.transfersReceived.length === 0 && (
          <tr>
            <td colSpan={5} className="text-[var(--admin-mute)]">
              No transfers.
            </td>
          </tr>
        )}
        {u.transfersSent.map((t) => (
          <tr key={t.id}>
            <td>{fmtDateTime(t.createdAt)}</td>
            <td>Sent</td>
            <td className="font-mono">{t.bottle.serial}</td>
            <td>{t.recipientEmail}</td>
            <td>
              <Badge value={t.status} />
            </td>
          </tr>
        ))}
        {u.transfersReceived.map((t) => (
          <tr key={t.id}>
            <td>{fmtDateTime(t.createdAt)}</td>
            <td>Received</td>
            <td className="font-mono">{t.bottle.serial}</td>
            <td>
              {t.sender.firstName} {t.sender.lastName}
            </td>
            <td>
              <Badge value={t.status} />
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
