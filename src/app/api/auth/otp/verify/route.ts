import { z } from "zod";
import { route, zEmail } from "@/lib/api";
import { verifyLoginCode } from "@/server/auth";

/** Flow 1: code → logged in, or "needs_profile" for a new account. */
export const POST = route(
  z.object({ email: zEmail, code: z.string().trim().regex(/^\d{6}$/) }),
  async ({ email, code }) => verifyLoginCode(email, code),
);
