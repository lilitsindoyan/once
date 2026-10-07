import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser, getVerifiedEmail } from "@/server/auth";
import { countryOptions } from "@/lib/capitals";
import { safeNext } from "@/lib/safe-next";
import { SplitScreen } from "@/components/portal/split-screen";
import { LoginFlow } from "./login-flow";

export async function generateMetadata() {
  const t = await getTranslations("login");
  return { title: t("title") };
}

/** Flow 1 — one screen for login and registration (design frames 233, 234, 236; email instead of phone). */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const sp = await searchParams;
  const locale = await getLocale();
  const next = safeNext(sp.next);
  if (await getCurrentUser()) redirect({ href: next, locale });

  return (
    <SplitScreen image="stand" caption={false}>
      <LoginFlow
        next={next}
        presetEmail={sp.email ?? ""}
        verifiedEmail={await getVerifiedEmail()}
        countries={countryOptions(locale)}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}
      />
    </SplitScreen>
  );
}
