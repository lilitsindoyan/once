import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { getPassport } from "@/server/bottles";
import { pageUser } from "@/server/guard";
import { SplitScreen } from "@/components/portal/split-screen";
import { TransferFlow } from "./transfer-flow";

export async function generateMetadata() {
  const t = await getTranslations("transfer");
  return { title: t("title") };
}

/** Flow 4 (sender) — design frames 216 and 82. */
export default async function TransferPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const user = await pageUser(`/my-bottles/${serial}/transfer`);
  const passport = await getPassport(user, serial).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  });

  return (
    <SplitScreen image="closeup" back={{ href: `/my-bottles/${passport.serial}` }}>
      <TransferFlow serial={passport.serial} initialShowName={passport.showName} ownEmail={user.email} />
    </SplitScreen>
  );
}
