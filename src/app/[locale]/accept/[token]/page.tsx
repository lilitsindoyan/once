import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { getTransferByToken } from "@/server/transfer";
import { Alert, Card, PageTitle } from "@/components/ui";
import { AcceptFlow } from "./accept-flow";

export async function generateMetadata() {
  const t = await getTranslations("accept");
  return { title: t("title") };
}

/** Flow 5 (recipient) — opened from the email link. */
export default async function AcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations("accept");
  const tc = await getTranslations("common");
  const [transfer, user] = await Promise.all([getTransferByToken(token), getCurrentUser()]);

  if (transfer.state !== "pending") {
    return (
      <div className="mx-auto max-w-lg">
        <PageTitle eyebrow="ONCE">{t("title")}</PageTitle>
        <Card>
          <Alert>{transfer.state === "used" ? t("used") : t("invalid")}</Alert>
        </Card>
      </div>
    );
  }

  const wrongAccount = !!user && user.email !== transfer.invitedEmail;

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle eyebrow="ONCE">{t("title")}</PageTitle>
      <Card>
        <div className="mb-6 border-b border-line pb-6">
          <p className="font-display text-3xl text-cream">{transfer.serial}</p>
          <p className="mt-1 text-sm text-copper">{transfer.series}</p>
          <p className="mt-4 text-cream">{t("passedBy", { sender: transfer.sender ?? tc("anonymousOwner") })}</p>
        </div>
        <AcceptFlow
          token={token}
          loggedInEmail={user?.email ?? null}
          wrongAccount={wrongAccount}
          invitedEmailMasked={transfer.invitedEmailMasked}
          invitedEmail={wrongAccount ? null : transfer.invitedEmail}
        />
      </Card>
    </div>
  );
}
