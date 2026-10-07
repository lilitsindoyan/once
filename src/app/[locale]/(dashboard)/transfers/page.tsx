import clsx from "clsx";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, ScanLine } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listMyTransfers } from "@/server/transfer";
import { pageUser } from "@/server/guard";
import { PageHeading } from "@/components/portal/kit";

export async function generateMetadata() {
  const t = await getTranslations("transfers");
  return { title: t("title") };
}

const STATUS_TONE: Record<string, string> = {
  PENDING: "text-copper border-copper/60",
  ACCEPTED: "text-[#b7d3a3] border-[#5f7a4f]",
  CANCELLED: "text-mute border-[#4a423b]",
  REASSIGNED: "text-mute border-[#4a423b]",
};

/** Transfers — design frame 212 (stats + recent transfers). */
export default async function TransfersPage() {
  const user = await pageUser("/transfers");
  const t = await getTranslations("transfers");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const { stats, rows } = await listMyTransfers(user);

  const cards = [
    [stats.awaitingRecipient, t("awaitingRecipient"), t("awaitingRecipientHint")],
    [stats.awaitingMe, t("awaitingYou"), t("awaitingYouHint")],
    [stats.completed, t("completed"), t("completedHint")],
  ] as const;

  return (
    <>
      <PageHeading title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-10 lg:mt-[clamp(16px,4.44vh,40px)] grid gap-10 lg:gap-[clamp(16px,4.44vh,40px)] 2xl:grid-cols-[1fr_300px]">
        <div>
          <h2 className="text-[11px] tracking-[0.28em] text-copper uppercase">{t("stats")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {cards.map(([n, label, hint]) => (
              <div key={label} className="border border-[#2b241e] bg-[#0d0b09]/85 p-6">
                <p className="font-display text-[40px] leading-none text-white">{n}</p>
                <p className="mt-4 text-[12px] tracking-[0.06em] text-copper uppercase">{label}</p>
                <p className="mt-1.5 text-[12px] text-cream-2">{hint}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 lg:mt-[clamp(19px,5.33vh,48px)] text-[11px] tracking-[0.28em] text-copper uppercase">{t("recent")}</h2>
          {rows.length === 0 ? (
            <p className="mt-6 lg:mt-[clamp(9px,2.67vh,24px)] text-[13px] text-mute">{t("empty")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#2a2420] border-y border-[#2a2420]">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#4a423b] text-copper">
                    {r.outgoing ? <ArrowUpRight className="size-4" strokeWidth={1.4} /> : <ArrowDownLeft className="size-4" strokeWidth={1.4} />}
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <p className="font-display text-[18px] tracking-[0.03em] text-white">{r.serial}</p>
                    <p className="mt-1 text-[12px] text-cream-2">
                      {r.series} · {r.batch}
                    </p>
                  </div>
                  <div className="min-w-[200px] flex-1 text-[12px] text-cream-2">
                    <p className="break-all">
                      {r.outgoing ? t("sentTo", { email: r.counterpart ?? "" }) : t("receivedFrom", { name: r.counterpart ?? tc("anonymousOwner") })}
                    </p>
                    <p className="mt-1 text-mute">
                      {t("initiatedOn", { date: format.dateTime(r.createdAt, { dateStyle: "medium", timeStyle: "short" }) })}
                    </p>
                  </div>
                  {r.awaitingMe ? (
                    <Link
                      href={`/transfers/${r.id}`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-bronze-1 to-bronze-2 px-4 py-2 text-[11px] tracking-[0.12em] text-white uppercase transition hover:brightness-110"
                    >
                      {t("reviewAccept")}
                      <ArrowRight className="size-3.5" strokeWidth={1.5} />
                    </Link>
                  ) : (
                    <span className={clsx("rounded-full border px-3 py-1 text-[11px] tracking-[0.06em] uppercase", STATUS_TONE[r.status])}>
                      {t(`status.${r.status}`)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/claim"
          className="hidden h-fit flex-col gap-4 2xl:flex border border-[#2b241e] bg-[#2a221c]/80 p-6 transition hover:bg-[#3a2e25]"
        >
          <ScanLine className="size-6 text-copper" strokeWidth={1.4} />
          <span className="text-[15px] text-white">{t("claimCardTitle")}</span>
          <span className="flex items-center justify-between text-[12px] text-cream-2">
            {t("claimCardText")}
            <ArrowRight className="size-4 text-white" strokeWidth={1.4} />
          </span>
        </Link>
      </div>
    </>
  );
}
