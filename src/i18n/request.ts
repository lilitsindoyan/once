import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { db } from "@/lib/db";

type Messages = Record<string, unknown>;

/** Sets "a.b.c" in a nested object. */
function setPath(obj: Messages, path: string, value: string) {
  const parts = path.split(".");
  let node = obj;
  for (const p of parts.slice(0, -1)) {
    if (typeof node[p] !== "object" || node[p] === null) node[p] = {};
    node = node[p] as Messages;
  }
  node[parts.at(-1)!] = value;
}

/**
 * Bundled messages, with overrides from Admin → Language strings (ToR 5.4) on top.
 * If the database is unreachable the bundled strings are used.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = structuredClone((await import(`../../messages/${locale}.json`)).default) as Messages;

  try {
    const overrides = await db.languageString.findMany({ where: { locale } });
    for (const o of overrides) setPath(messages, o.key, o.value);
  } catch {
    // keep bundled strings
  }
  // One time zone for server and browser rendering, so dates never differ between the two.
  return { locale, messages, timeZone: process.env.APP_TIMEZONE ?? "Asia/Yerevan" };
});
