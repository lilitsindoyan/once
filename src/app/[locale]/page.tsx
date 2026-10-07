import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth";

/** The public landing is built separately; this app's start page sends people to the portal. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getCurrentUser();
  redirect({ href: user ? "/my-bottles" : "/claim", locale });
}
