import { z } from "zod";
import { route, zName } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { updateLocale, updateName } from "@/server/profile";

export const GET = route(null, async () => {
  const u = await requireUser();
  return { email: u.email, firstName: u.firstName, lastName: u.lastName, country: u.country, locale: u.locale };
});

export const PATCH = route(
  z.object({ firstName: zName.optional(), lastName: zName.optional(), locale: z.enum(["hy", "en", "ru"]).optional() }),
  async (body) => {
    const user = await requireUser();
    if (body.firstName && body.lastName) await updateName(user, body.firstName, body.lastName);
    if (body.locale) await updateLocale(user, body.locale);
    return { ok: true };
  },
);
