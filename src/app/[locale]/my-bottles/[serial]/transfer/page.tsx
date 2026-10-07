import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { getPassport } from "@/server/bottles";
import { pageUser } from "@/server/guard";
import { PageTitle } from "@/components/ui";
import { TransferFlow } from "./transfer-flow";

export async function generateMetadata() {
  const t = await getTranslations("transfer");
  return { title: t("title") };
}

/** Flow 4 (sender). */
export default async function TransferPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const user = await pageUser(`/my-bottles/${serial}/transfer`);
  const t = await getTranslations("transfer");
  const passport = await getPassport(user, serial).catch((e) => {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle eyebrow={passport.serial}>{t("title")}</PageTitle>
      <TransferFlow serial={passport.serial} initialShowName={passport.showName} ownEmail={user.email} />
    </div>
  );
}
