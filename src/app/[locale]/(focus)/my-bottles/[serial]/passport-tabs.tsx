"use client";

import clsx from "clsx";
import { useState, type ReactNode } from "react";

/** Overview / Ownership history. The design's third tab (Scan log) was removed in ToR v1.2. */
export function PassportTabs({
  labels,
  overview,
  history,
}: {
  labels: { overview: string; history: string };
  overview: ReactNode;
  history: ReactNode;
}) {
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const tabs = [
    ["overview", labels.overview],
    ["history", labels.history],
  ] as const;

  return (
    <div className="mt-10">
      <div role="tablist" className="flex max-w-[420px] gap-8 border-b border-[#2a2420]">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setTab(key)}
            className={clsx(
              "relative -mb-px pb-3 text-[12px] tracking-[0.06em] uppercase transition",
              tab === key ? "text-copper" : "text-cream hover:text-white",
            )}
          >
            {label}
            {tab === key && <span className="absolute right-0 bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-copper to-transparent" />}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-8">
        {tab === "overview" ? overview : history}
      </div>
    </div>
  );
}
