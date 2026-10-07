import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "./auth";

/** For portal pages: the logged-in user, or a redirect to Login that comes back here. */
export async function pageUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: { pathname: "/login", query: { next: returnTo } }, locale });
  }
  return user;
}
