import { z } from "zod";
import { route, zLocale } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { claimBottle, getPendingClaim } from "@/server/claim";

export const GET = route(null, async () => ({ pending: await getPendingClaim() }));

/** Flow 2, steps 5–7. */
export const POST = route(z.object({ showName: z.boolean(), locale: zLocale }), async ({ showName, locale }) =>
  claimBottle(await requireUser(), showName, locale),
);
