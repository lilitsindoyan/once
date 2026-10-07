import clsx from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/*
 * Portal UI in the ONCE style (Figma frames 108 / 118):
 * black ground, copper accents, Didot headings, Cormorant buttons, Montserrat body.
 */

export function PageTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <header className="mb-10">
      {eyebrow && <p className="mb-2 text-sm tracking-[0.2em] text-copper uppercase sm:text-base">{eyebrow}</p>}
      <h1 className="font-display text-4xl leading-tight text-cream sm:text-5xl">{children}</h1>
    </header>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx("border border-line bg-panel/80 p-6 sm:p-8", className)}>{children}</section>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "outline" | "solid" | "ghost"; busy?: boolean };

export function Button({ variant = "outline", busy, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={clsx(
        "inline-flex min-h-[46px] items-center justify-center px-6 py-2 font-serif text-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "outline" && "border border-copper-border text-white hover:bg-copper/15",
        variant === "solid" && "bg-panel text-sm tracking-[0.26em] text-white uppercase hover:bg-[#222]",
        variant === "ghost" && "px-0 text-base text-copper underline-offset-4 hover:underline",
        className,
      )}
    >
      {busy ? "…" : children}
    </button>
  );
}

export const linkButton =
  "inline-flex min-h-[46px] items-center justify-center border border-copper-border px-6 py-2 font-serif text-lg text-white transition-colors hover:bg-copper/15";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-[0.18em] text-mute uppercase">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-mute">{hint}</span>}
      {error && <span className="mt-1.5 block text-sm text-danger">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full border border-line bg-ink px-4 py-3 text-base text-cream placeholder:text-[#5a5049] focus:border-copper focus:outline-none";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(inputClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(inputClass, "appearance-none", props.className)} />;
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info" | "ok"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "border-l-2 px-4 py-3 text-sm",
        tone === "error" && "border-danger bg-danger/10 text-[#f0c2b8]",
        tone === "info" && "border-copper bg-copper/10 text-cream",
        tone === "ok" && "border-ok bg-ok/10 text-[#d6e6cc]",
      )}
    >
      {children}
    </div>
  );
}

/** Show my name / Stay anonymous — used at claim, transfer and accept. */
export function PrivacyChoice({
  value,
  onChange,
  labels,
}: {
  value: boolean;
  onChange: (showName: boolean) => void;
  labels: { show: string; showHint: string; anon: string; anonHint: string };
}) {
  const option = (checked: boolean, title: string, hint: string, v: boolean) => (
    <label
      className={clsx(
        "flex cursor-pointer gap-4 border p-4 transition-colors",
        checked ? "border-copper bg-copper/10" : "border-line hover:border-copper/60",
      )}
    >
      <input type="radio" name="privacy" className="mt-1 accent-[#b27649]" checked={checked} onChange={() => onChange(v)} />
      <span>
        <span className="block font-serif text-xl text-cream">{title}</span>
        <span className="mt-1 block text-sm text-mute">{hint}</span>
      </span>
    </label>
  );
  return (
    <div className="grid gap-3">
      {option(value, labels.show, labels.showHint, true)}
      {option(!value, labels.anon, labels.anonHint, false)}
    </div>
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-line py-3 sm:grid sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="text-xs tracking-[0.18em] text-mute uppercase">{label}</dt>
      <dd className="mt-1 text-cream sm:mt-0">{children}</dd>
    </div>
  );
}
