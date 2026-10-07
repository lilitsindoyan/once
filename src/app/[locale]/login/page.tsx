import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser, getVerifiedEmail } from "@/server/auth";
import { countryOptions } from "@/lib/capitals";
import { safeNext } from "@/lib/safe-next";
import { PageTitle } from "@/components/ui";
import { LoginFlow } from "./login-flow";

export async function generateMetadata() {
  const t = await getTranslations("login");
  return { title: t("title") };
}

/** Flow 1 — one screen for login and registration. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect({ href: next, locale });

  const t = await getTranslations("login");
  const verifiedEmail = await getVerifiedEmail();

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle eyebrow="ONCE">{t("title")}</PageTitle>
      <LoginFlow
        next={next}
        presetEmail={sp.email ?? ""}
        verifiedEmail={verifiedEmail}
        countries={countryOptions(locale)}
      />
    </div>
  );
}
