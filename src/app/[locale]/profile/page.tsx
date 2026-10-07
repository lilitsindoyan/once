import { getLocale, getTranslations } from "next-intl/server";
import { countryName } from "@/lib/capitals";
import { pageUser } from "@/server/guard";
import { PageTitle } from "@/components/ui";
import { ProfileForms } from "./profile-forms";

export async function generateMetadata() {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

/** Flow 6. */
export default async function ProfilePage() {
  const user = await pageUser("/profile");
  const t = await getTranslations("profile");
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle eyebrow="ONCE">{t("title")}</PageTitle>
      <ProfileForms
        user={{
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          country: countryName(user.country, locale),
          locale: user.locale,
        }}
      />
    </div>
  );
}
