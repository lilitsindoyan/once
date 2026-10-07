import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth";
import { getPendingClaim } from "@/server/claim";
import { SplitScreen } from "@/components/portal/split-screen";
import { ClaimFlow } from "./claim-flow";

export async function generateMetadata() {
  const t = await getTranslations("claim");
  return { title: t("title") };
}

/**
 * Flow 2. The general QR code on every bottle opens this page.
 * Design frames 156–166, adapted to v1.2: the camera "Scan" step becomes entering serial + hidden code.
 */
export default async function ClaimPage() {
  const [user, pending] = await Promise.all([getCurrentUser(), getPendingClaim()]);
  return (
    <SplitScreen image="closeup" back={user ? { href: "/my-bottles" } : undefined}>
      <ClaimFlow loggedIn={!!user} pending={pending} />
    </SplitScreen>
  );
}
