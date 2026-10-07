import { z } from "zod";
import { clientKey, route } from "@/lib/api";
import { checkClaim } from "@/server/claim";

/** ToR 4.1 — checked before login. */
export const POST = route(
  z.object({ serial: z.string().trim().min(4).max(40), code: z.string().trim().min(4).max(40) }),
  async ({ serial, code }) => checkClaim(serial, code, await clientKey()),
);
