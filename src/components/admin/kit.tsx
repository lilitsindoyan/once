import clsx from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* Neutral admin UI kit (light). Same API shape as shadcn/ui so it can be swapped later. */

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-[var(--admin-mute)]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card)] p-5", className)}>
      {title && <h2 className="mb-4 text-sm font-semibold tracking-wide text-[var(--admin-mute)] uppercase">{title}</h2>}
      {children}
    </section>
  );
}

const btn = {
  primary: "bg-[var(--admin-accent)] text-white hover:opacity-90",
  secondary: "border border-[var(--admin-border)] bg-white hover:bg-zinc-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export function AButton({
  variant = "primary",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btn }) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-50",
        btn[variant],
        className,
      )}
    />
  );
}

export function ALink({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: keyof typeof btn }) {
  return (
    <Link href={href} className={clsx("inline-flex h-9 items-center rounded-md px-4 text-sm font-medium", btn[variant])}>
      {children}
    </Link>
  );
}

const field =
  "h-9 w-full rounded-md border border-[var(--admin-border)] bg-white px-3 text-sm focus:border-[var(--admin-accent)] focus:outline-none";

export function AInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(field, props.className)} />;
}
export function ASelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(field, props.className)} />;
}
export function ATextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(field, "h-auto py-2", props.className)} />;
}

export function ALabel({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--admin-mute)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--admin-mute)]">{hint}</span>}
    </label>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--admin-border)] bg-zinc-50 text-xs text-[var(--admin-mute)] uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:px-4 [&_td]:py-3 [&_tr]:border-b [&_tr]:border-[var(--admin-border)] [&_tr:last-child]:border-0">
          {children}
        </tbody>
      </table>
    </div>
  );
}

const tones: Record<string, string> = {
  UNCLAIMED: "bg-zinc-100 text-zinc-700",
  OWNED: "bg-green-100 text-green-800",
  IN_TRANSFER: "bg-amber-100 text-amber-800",
  DEACTIVATED: "bg-red-100 text-red-800",
  ACTIVE: "bg-green-100 text-green-800",
  CLOSED: "bg-zinc-200 text-zinc-700",
  SUSPENDED: "bg-red-100 text-red-800",
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
  REASSIGNED: "bg-zinc-200 text-zinc-700",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={clsx("inline-block rounded px-2 py-0.5 text-xs font-medium", tones[value] ?? "bg-zinc-100")}>
      {value.replace("_", " ").toLowerCase()}
    </span>
  );
}

/** Shows ?ok= / ?err= messages set by server actions. */
export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (!ok && !err) return null;
  return (
    <div
      role={err ? "alert" : "status"}
      className={clsx(
        "mb-6 rounded-md border px-4 py-3 text-sm",
        err ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800",
      )}
    >
      {err ? (ADMIN_ERRORS[err] ?? `Error: ${err}`) : ok}
    </div>
  );
}

const ADMIN_ERRORS: Record<string, string> = {
  invalid_input: "Some fields are invalid.",
  admin_login_failed: "Wrong email or password.",
  admin_2fa_invalid: "The authenticator code is wrong.",
  bottle_not_in_transfer: "This bottle has no pending transfer.",
  bottle_state: "This action isn't possible in the bottle's or account's current state.",
  email_in_use: "This email belongs to another open account.",
  forbidden: "You don't have permission for this.",
  not_found: "Not found.",
  generic: "Something went wrong.",
};

export function Pager({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      {page > 1 && <ALink href={href(page - 1)}>← Prev</ALink>}
      <span className="text-[var(--admin-mute)]">
        Page {page} of {pages}
      </span>
      {page < pages && <ALink href={href(page + 1)}>Next →</ALink>}
    </div>
  );
}

export const fmtDate = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d) : "—";
export const fmtDateTime = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";

/** A file download (CSV, PNG) from an admin API route — a plain link, not client navigation. */
export function Download({ href, children, variant = "secondary" }: { href: string; children: ReactNode; variant?: keyof typeof btn | "text" }) {
  const cls =
    variant === "text"
      ? "text-[var(--admin-accent)] hover:underline"
      : clsx("inline-flex h-9 items-center rounded-md px-4 text-sm font-medium", btn[variant]);
  return (
    <a href={href} download className={cls}>
      {children}
    </a>
  );
}
