import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Adds the language prefix (/hy, /en, /ru). /admin and /api are left alone. */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
