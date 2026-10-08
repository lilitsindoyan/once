import { getLocale, getTranslations } from "next-intl/server";
import { countryName } from "@/lib/capitals";
import { getCurrentUser } from "@/server/auth";
import { landingPins } from "@/server/landing";
import { Landing } from "@/components/landing/landing";

export async function generateMetadata() {
  const t = await getTranslations("landing");
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription"),
    robots: { index: true, follow: true },
    openGraph: { title: t("metaTitle"), description: t("metaDescription"), images: ["/landing/hero.jpg"] },
  };
}

/** Public landing (Figma landing frames 99–122). The map shows live pins from the database. */
export default async function Home() {
  const locale = await getLocale();
  const [user, pins] = await Promise.all([getCurrentUser(), landingPins()]);
  const countryNames = Object.fromEntries(pins.map((p) => [p.countryCode, countryName(p.countryCode, locale)]));

  return <Landing pins={pins} countryNames={countryNames} loggedIn={!!user} contactEmail={process.env.NEXT_PUBLIC_CONTACT_EMAIL} />;
}
