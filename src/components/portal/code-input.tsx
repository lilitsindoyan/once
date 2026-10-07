"use client";

import { useRef } from "react";

/** Six single-digit boxes from the design (frames 234/235). Paste of a full code fills all boxes. */
export function CodeInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const set = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, 6));
  };

  return (
    <div role="group" aria-label={label} className="flex gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${label} ${i + 1}`}
          value={d}
          autoFocus={i === 0}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            // Typing over a filled box: keep only the new digit.
            if (d && v.length === 2) {
              set(i, v.startsWith(d) ? v[1] : v[0]);
              if (i < 5) refs.current[i + 1]?.focus();
              return;
            }
            // A whole code pasted or auto-filled into one box: spread it.
            if (v.length > 1) {
              onChange(v.slice(0, 6));
              refs.current[Math.min(v.length, 5)]?.focus();
              return;
            }
            set(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (v) {
              e.preventDefault();
              onChange(v);
              refs.current[Math.min(v.length, 5)]?.focus();
            }
          }}
          className="h-[60px] w-full min-w-0 border border-[#3b332c] bg-transparent text-center font-display text-2xl text-white focus:border-copper focus:outline-none sm:h-[66px]"
        />
      ))}
    </div>
  );
}

export function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
