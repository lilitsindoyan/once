import { z } from "zod";
import { route, zEmail, zLocale } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { requestEmailChange } from "@/server/profile";

export const POST = route(z.object({ email: zEmail, locale: zLocale }), async ({ email, locale }) =>
  requestEmailChange(await requireUser(), email, locale),
);
