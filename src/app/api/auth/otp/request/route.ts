import { z } from "zod";
import { route, zEmail, zLocale } from "@/lib/api";
import { requestLoginCode } from "@/server/auth";

/** Flow 1: email → one-time code by email. */
export const POST = route(z.object({ email: zEmail, locale: zLocale }), async ({ email, locale }) =>
  requestLoginCode(email, locale),
);
