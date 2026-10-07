import { z } from "zod";
import { route, zLocale } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { acceptTransfer } from "@/server/transfer";

/** Accept from the Transfers page (logged in with the invited email) — same rules as the email link. */
export const POST = route(
  z.object({ showName: z.boolean(), locale: zLocale }),
  async ({ showName, locale }, _req, { id }: { id: string }) => acceptTransfer(await requireUser(), { id }, showName, locale),
);
