import { getTranslations } from "next-intl/server";
import { pageUser } from "@/server/guard";
import { ChangeEmailForm } from "./email-form";

export async function generateMetadata() {
  const t = await getTranslations("profile");
  return { title: t("emailTitle") };
}

/** Design frames 148–149 ("Change phone number"), adapted to email per v1.2. */
export default async function ChangeEmailPage() {
  const user = await pageUser("/profile/email");
  return <ChangeEmailForm currentEmail={user.email} />;
}
