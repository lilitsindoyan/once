import Link from "next/link";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { bottleDetail } from "@/server/admin/bottles";
import { pageAdmin } from "@/server/admin/page";
import type { PassportField } from "@/server/bottles";
import { bottleAction, passportValuesAction } from "../../../actions";
import { AButton, AInput, ALabel, ATextarea, Badge, Flash, fmtDate, fmtDateTime, PageHeader, Panel, Table } from "@/components/admin/kit";

export const metadata = { title: "Bottle" };

/** ToR 5.2.2 — everything about one bottle, plus customer-service actions. */
export default async function BottleDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const admin = await pageAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const b = await bottleDetail(admin, id).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  });
  const template = b.series.passportTemplate as PassportField[];
  const values = b.passportValues as Record<string, string>;
  const defaults = b.series.passportDefaults as Record<string, string>;
  const pending = b.transfers.find((t) => t.status === "PENDING");

  const op = (name: string, label: string, variant: "primary" | "secondary" | "danger" = "secondary") => (
    <form action={bottleAction}>
      <input type="hidden" name="bottleId" value={b.id} />
      <input type="hidden" name="op" value={name} />
      <AButton type="submit" variant={variant}>
        {label}
      </AButton>
    </form>
  );

  return (
    <>
      <PageHeader
        title={b.serial}
        sub={
          <>
            {b.series.name} · batch {b.series.batchNumber} · <Badge value={b.status} />
          </>
        }
      />
      <Flash ok={sp.ok} err={sp.err} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Identity">
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-[var(--admin-mute)]">Serial</dt>
            <dd className="font-mono">{b.serial}</dd>
            <dt className="text-[var(--admin-mute)]">Hidden code</dt>
            <dd className="font-mono">{b.hiddenCode}</dd>
            <dt className="text-[var(--admin-mute)]">Current owner</dt>
            <dd>
              {b.currentOwner ? (
                <Link href={`/admin/customers/${b.currentOwner.id}`} className="text-[var(--admin-accent)] hover:underline">
                  {b.currentOwner.firstName} {b.currentOwner.lastName} ({b.currentOwner.email})
                </Link>
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-[var(--admin-mute)]">Claimed</dt>
            <dd>{fmtDate(b.claimedAt)}</dd>
            <dt className="text-[var(--admin-mute)]">Created</dt>
            <dd>{fmtDate(b.createdAt)}</dd>
          </dl>
        </Panel>

        <Panel title="Actions">
          <div className="grid gap-4">
            {pending && (
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                Waiting for <strong>{pending.recipientEmail}</strong> since {fmtDateTime(pending.createdAt)}.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {pending && op("cancel", "Cancel transfer", "danger")}
              {pending && op("resend", "Resend invitation")}
              {b.status === "DEACTIVATED" ? op("reactivate", "Reactivate") : op("deactivate", "Deactivate", "danger")}
            </div>
            {(b.status === "OWNED" || b.status === "IN_TRANSFER") && (
              <form action={bottleAction} className="grid gap-2 border-t border-[var(--admin-border)] pt-4">
                <input type="hidden" name="bottleId" value={b.id} />
                <input type="hidden" name="op" value="reassign" />
                <ALabel
                  label={b.status === "IN_TRANSFER" ? "Redirect the transfer to another email" : "Reassign to another account or email"}
                  hint={
                    b.status === "IN_TRANSFER"
                      ? "The old link stops working; a new invitation goes to this email."
                      : "If an open account uses this email, the bottle moves to it now. Otherwise an invitation is sent."
                  }
                >
                  <AInput name="email" type="email" required placeholder="new.owner@example.com" />
                </ALabel>
                <div>
                  <AButton type="submit" variant="secondary">
                    Reassign
                  </AButton>
                </div>
              </form>
            )}
          </div>
        </Panel>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-[var(--admin-mute)] uppercase">Ownership history</h2>
      <Table head={["From", "To", "Owner (real name)", "Shown as", "On Bottle Owners"]}>
        {b.periods.length === 0 && (
          <tr>
            <td colSpan={5} className="text-[var(--admin-mute)]">
              Never claimed.
            </td>
          </tr>
        )}
        {b.periods.map((p) => (
          <tr key={p.id}>
            <td>{fmtDate(p.startedAt)}</td>
            <td>{p.endedAt ? fmtDate(p.endedAt) : "present"}</td>
            <td>
              <Link href={`/admin/customers/${p.userId}`} className="hover:underline">
                {p.user.firstName} {p.user.lastName}
              </Link>
              <span className="block text-xs text-[var(--admin-mute)]">{p.user.email}</span>
            </td>
            <td>{p.showName ? "Name" : "Anonymous owner"}</td>
            <td>{!p.endedAt && p.showName ? (p.hiddenByAdmin ? "Hidden by admin" : "Yes") : "—"}</td>
          </tr>
        ))}
      </Table>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-[var(--admin-mute)] uppercase">Transfers</h2>
      <Table head={["Sent", "From", "To email", "Status", "Accepted / cancelled"]}>
        {b.transfers.length === 0 && (
          <tr>
            <td colSpan={5} className="text-[var(--admin-mute)]">
              No transfers.
            </td>
          </tr>
        )}
        {b.transfers.map((t) => (
          <tr key={t.id}>
            <td>{fmtDateTime(t.createdAt)}</td>
            <td>
              {t.sender.firstName} {t.sender.lastName}
            </td>
            <td>{t.recipientEmail}</td>
            <td>
              <Badge value={t.status} />
            </td>
            <td>{fmtDateTime(t.acceptedAt ?? t.cancelledAt)}</td>
          </tr>
        ))}
      </Table>

      {template.length > 0 && (
        <Panel title="Passport values for this bottle" className="mt-8 max-w-3xl">
          <p className="mb-4 text-xs text-[var(--admin-mute)]">
            Leave a field empty to use the series value (shown as placeholder). Edit series values on the{" "}
            <Link href={`/admin/series/${b.seriesId}`} className="underline">
              series page
            </Link>
            .
          </p>
          <form action={passportValuesAction} className="grid gap-4">
            <input type="hidden" name="bottleId" value={b.id} />
            {template.map((f) => (
              <ALabel key={f.key} label={f.label.en}>
                {f.type === "longtext" ? (
                  <ATextarea name={`f_${f.key}`} rows={3} defaultValue={values[f.key] ?? ""} placeholder={defaults[f.key] ?? ""} />
                ) : (
                  <AInput name={`f_${f.key}`} type={f.type === "date" ? "date" : "text"} defaultValue={values[f.key] ?? ""} placeholder={defaults[f.key] ?? ""} />
                )}
              </ALabel>
            ))}
            <div>
              <AButton type="submit">Save passport</AButton>
            </div>
          </form>
        </Panel>
      )}
    </>
  );
}
