import { getLocale, getTranslations } from "next-intl/server";
import { countryName } from "@/lib/capitals";
import { pageUser } from "@/server/guard";
import { EditDetailsForm } from "./edit-form";

export async function generateMetadata() {
  const t = await getTranslations("profile");
  return { title: t("editTitle") };
}

/** Design frames 147 (edit) and 150 (updated). Country stays read-only (ToR 3.2.2). */
export default async function EditProfilePage() {
  const user = await pageUser("/profile/edit");
  const locale = await getLocale();
  return (
    <EditDetailsForm
      initial={{ firstName: user.firstName, lastName: user.lastName, locale: user.locale }}
      country={countryName(user.country, locale)}
    />
  );
}
