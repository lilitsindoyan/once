import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTransfer } from "@/server/transfer";
import { pageUser } from "@/server/guard";
import { Display, Notice } from "@/components/portal/kit";
import { SplitScreen } from "@/components/portal/split-screen";
import { AcceptFlow } from "../../accept/[token]/accept-flow";

export async function generateMetadata() {
  const t = await getTranslations("accept");
  return { title: t("title") };
}

/**
 * Accept from the Transfers page, without opening the email link.
 * Only the logged-in person the bottle was sent to can see it; anyone else gets 404.
 */
export default async function AcceptFromTransfersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await pageUser(`/transfers/${id}`);
  const t = await getTranslations("accept");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const transfer = await getTransfer({ id });

  if (transfer.state !== "pending") {
    return (
      <SplitScreen image="stand" back={{ href: "/transfers" }}>
        <div className="max-w-[440px]">
          <Display>{t("title")}</Display>
          <div className="mt-8">
            <Notice>{transfer.state === "used" ? t("used") : t("invalid")}</Notice>
          </div>
        </div>
      </SplitScreen>
    );
  }
  if (transfer.invitedEmail !== user.email) notFound();

  const d = (x: Date | null) => (x ? format.dateTime(x, { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <SplitScreen image="stand" back={{ href: "/transfers" }}>
      <AcceptFlow
        acceptUrl={`/api/me/transfers/${id}/accept`}
        returnPath={`/transfers/${id}`}
        bottle={{
          serial: transfer.serial,
          seriesBatch: `${transfer.series} · ${transfer.batch}`,
          productionDate: d(transfer.productionDate),
          from: transfer.sender ?? tc("anonymousOwner"),
          transferredOn: format.dateTime(transfer.sentAt, { dateStyle: "medium", timeStyle: "short" }),
        }}
        loggedInEmail={user.email}
        wrongAccount={false}
        invitedEmailMasked={transfer.invitedEmailMasked}
        invitedEmail={null}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}
      />
    </SplitScreen>
  );
}
