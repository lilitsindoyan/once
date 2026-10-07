import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { getPendingClaim } from "@/server/claim";
import { PageTitle } from "@/components/ui";
import { ClaimFlow } from "./claim-flow";

export async function generateMetadata() {
  const t = await getTranslations("claim");
  return { title: t("title") };
}

/** Flow 2. The general QR code on every bottle opens this page. */
export default async function ClaimPage() {
  const t = await getTranslations("claim");
  const [user, pending] = await Promise.all([getCurrentUser(), getPendingClaim()]);

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle eyebrow="ONCE">{t("title")}</PageTitle>
      <ClaimFlow loggedIn={!!user} pending={pending} />
    </div>
  );
}
