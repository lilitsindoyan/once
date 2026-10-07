import { getFormatter, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { getTransferByToken } from "@/server/transfer";
import { Display, Notice } from "@/components/portal/kit";
import { SplitScreen } from "@/components/portal/split-screen";
import { AcceptFlow } from "./accept-flow";

export async function generateMetadata() {
  const t = await getTranslations("accept");
  return { title: t("title") };
}

/** Flow 5 (recipient) — design frames 291 (invitation) and 294 (accepted). Decline is not in ToR v1.2. */
export default async function AcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("accept");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const [transfer, user] = await Promise.all([getTransferByToken(token), getCurrentUser()]);

  if (transfer.state !== "pending") {
    return (
      <SplitScreen image="stand">
        <div className="max-w-[440px] lg:pt-6">
          <Display>{t("title")}</Display>
          <div className="mt-8 lg:mt-[clamp(12px,3.56vh,32px)]">
            <Notice>{transfer.state === "used" ? t("used") : t("invalid")}</Notice>
          </div>
        </div>
      </SplitScreen>
    );
  }

  const wrongAccount = !!user && user.email !== transfer.invitedEmail;
  const d = (x: Date | null) => (x ? format.dateTime(x, { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <SplitScreen image="stand">
      <AcceptFlow
        token={token}
        bottle={{
          serial: transfer.serial,
          seriesBatch: `${transfer.series} · ${transfer.batch}`,
          productionDate: d(transfer.productionDate),
          from: transfer.sender ?? tc("anonymousOwner"),
          transferredOn: format.dateTime(transfer.sentAt, { dateStyle: "medium", timeStyle: "short" }),
        }}
        loggedInEmail={user?.email ?? null}
        wrongAccount={wrongAccount}
        invitedEmailMasked={transfer.invitedEmailMasked}
        invitedEmail={wrongAccount ? null : transfer.invitedEmail}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}
      />
    </SplitScreen>
  );
}
