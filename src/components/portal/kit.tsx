import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Link } from "@/i18n/navigation";

/*
 * Portal design kit — from the Figma file "ONCE _ JJ_26_2 (Copy)":
 * Didot uppercase headings, copper eyebrows, bronze gradient primary buttons,
 * dark info panels with copper labels.
 */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-[11px] tracking-[0.28em] text-copper uppercase", className)}>{children}</p>;
}

/** Large Didot heading. `upper` = the uppercase style used on most portal screens. */
export function Display({ children, upper = true, className }: { children: ReactNode; upper?: boolean; className?: string }) {
  return (
    <h1
      className={clsx(
        "font-display leading-[1.08] text-white",
        upper ? "text-[34px] tracking-[0.04em] uppercase lg:text-[clamp(26px,4.6vh,44px)]" : "text-[40px] lg:text-[clamp(32px,6vh,56px)]",
        className,
      )}
    >
      {children}
    </h1>
  );
}

/** Page title in the dashboard: "MY BOTTLES" + spaced subtitle. */
export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.06em] text-white uppercase lg:text-[clamp(22px,3.4vh,30px)]">{title}</h1>
      {subtitle && <p className="mt-[clamp(6px,1.3vh,12px)] text-[11px] tracking-[0.28em] text-mute uppercase">{subtitle}</p>}
    </div>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-sm leading-relaxed tracking-[0.02em] text-cream-2", className)}>{children}</p>;
}

const primary =
  "group inline-flex min-h-[56px] lg:min-h-[clamp(44px,6.2vh,56px)] w-full items-center justify-center gap-4 bg-gradient-to-r from-bronze-1 to-bronze-2 px-8 font-display text-[15px] tracking-[0.22em] text-white uppercase shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
const outline =
  "inline-flex min-h-[56px] lg:min-h-[clamp(44px,6.2vh,56px)] w-full items-center justify-center gap-3 border border-copper-border px-8 font-display text-[15px] tracking-[0.22em] text-white uppercase transition hover:bg-copper/10 disabled:opacity-50";
const small =
  "inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#4a4038] px-6 text-[13px] tracking-[0.04em] text-cream transition hover:border-copper hover:text-white";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; arrow?: boolean };

export function PrimaryButton({ busy, arrow = true, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={disabled || busy} className={clsx(primary, className)}>
      <span className="flex-1 text-center">{busy ? "…" : children}</span>
      {arrow && <ArrowRight className="size-5 shrink-0 transition group-hover:translate-x-0.5" strokeWidth={1.5} />}
    </button>
  );
}

export function OutlineButton({ busy, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={disabled || busy} className={clsx(outline, className)}>
      {busy ? "…" : children}
    </button>
  );
}

type LinkHref = Parameters<typeof Link>[0]["href"];

export function PrimaryLink({ href, children, className }: { href: LinkHref; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx(primary, className)}>
      <span className="flex-1 text-center">{children}</span>
      <ArrowRight className="size-5 shrink-0 transition group-hover:translate-x-0.5" strokeWidth={1.5} />
    </Link>
  );
}

export function SmallLink({ href, children, className }: { href: LinkHref; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={clsx(small, className)}>
      {children}
    </Link>
  );
}

export function TextLink({ href, children, className }: { href: LinkHref; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx("inline-flex items-center gap-3 text-xs tracking-[0.12em] text-cream uppercase underline-offset-4 hover:underline", className)}
    >
      {children}
      <ArrowRight className="size-3.5" strokeWidth={1.5} />
    </Link>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string | null; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[11px] tracking-[0.14em] text-cream-2 uppercase">{label}</span>
      {children}
      {hint && !error && <span className="mt-2 block text-xs text-mute">{hint}</span>}
      {error && <span className="mt-2 block text-sm text-danger">{error}</span>}
    </label>
  );
}

const inputCls =
  "h-[56px] lg:h-[clamp(44px,6.2vh,56px)] w-full border border-[#3b332c] bg-transparent px-5 text-[15px] text-white placeholder:tracking-[0.3em] placeholder:text-[#5d5249] focus:border-copper focus:outline-none";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputCls, props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={clsx(inputCls, "appearance-none bg-ink pr-12", props.className)} />
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-cream-2">
        ▾
      </span>
    </div>
  );
}

/** Dark panel with label / value rows (bottle details, transfer details). */
export function InfoPanel({ rows, className, children }: { rows: [string, ReactNode][]; className?: string; children?: ReactNode }) {
  return (
    <div className={clsx("border border-[#2b241e] bg-[#0d0b09]/90 px-6 py-[clamp(12px,2.2vh,20px)]", className)}>
      <dl className="grid gap-y-[clamp(8px,1.5vh,14px)]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,150px)_1fr] items-center gap-4">
            <dt className="text-[11px] tracking-[0.1em] text-copper-2 uppercase">{label}</dt>
            <dd className="text-[13px] text-white">{value}</dd>
          </div>
        ))}
      </dl>
      {children}
    </div>
  );
}

/** Ruled rows (passport overview). */
export function RuledRows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="max-w-[420px]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[170px_1fr] items-center gap-4 border-b border-[#2a2420] py-[clamp(5px,1.35vh,14px)]">
          <dt className="text-[12px] tracking-[0.06em] text-copper-2 uppercase">{label}</dt>
          <dd className="text-[13px] text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Display my identity" / "Remain anonymous". */
export function IdentityChoice({
  value,
  onChange,
  labels,
}: {
  value: boolean;
  onChange: (showName: boolean) => void;
  labels: { show: string; showHint: string; anon: string; anonHint: string };
}) {
  const option = (checked: boolean, title: string, hint: string, v: boolean, last: boolean) => (
    <label className={clsx("flex cursor-pointer gap-5 py-[clamp(10px,2vh,20px)]", !last && "border-b border-[#2e2722]")}>
      <input type="radio" name="identity" className="peer sr-only" checked={checked} onChange={() => onChange(v)} />
      <span
        aria-hidden
        className={clsx(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border peer-focus-visible:outline-2 peer-focus-visible:outline-copper",
          checked ? "border-copper" : "border-[#6b625a]",
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-copper" />}
      </span>
      <span>
        <span className="block text-[13px] tracking-[0.06em] text-copper uppercase">{title}</span>
        <span className="mt-2 block text-[13px] leading-relaxed text-cream-2">{hint}</span>
      </span>
    </label>
  );
  return (
    <div role="radiogroup">
      {option(value, labels.show, labels.showHint, true, false)}
      {option(!value, labels.anon, labels.anonHint, false, true)}
    </div>
  );
}

/** Steps on the claim flow: 1 Enter · 2 Identify · 3 Verify · 4 Claim. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase" aria-label="Steps">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === current ? "step" : undefined}>
          <span
            className={clsx(
              "grid size-6 place-items-center rounded-full border text-[11px]",
              i < current && "border-copper bg-copper text-ink",
              i === current && "border-copper text-copper",
              i > current && "border-[#4a423b] text-mute",
            )}
          >
            {i + 1}
          </span>
          <span className={clsx("hidden sm:inline", i === current ? "text-cream" : "text-mute")}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-5 bg-[#3d352e] sm:w-8" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "info" | "ok"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "border-l-2 px-4 py-3 text-[13px] leading-relaxed",
        tone === "error" && "border-danger bg-danger/10 text-[#f0c2b8]",
        tone === "info" && "border-copper bg-copper/10 text-cream",
        tone === "ok" && "border-ok bg-ok/10 text-[#d6e6cc]",
      )}
    >
      {children}
    </div>
  );
}

export function Divider() {
  return <hr className="border-[#2e2722]" />;
}
