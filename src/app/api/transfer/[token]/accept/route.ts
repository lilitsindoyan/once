import { z } from "zod";
import { route, zLocale } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { acceptTransfer } from "@/server/transfer";

export const POST = route(
  z.object({ showName: z.boolean(), locale: zLocale }),
  async ({ showName, locale }, _req, { token }: { token: string }) =>
    acceptTransfer(await requireUser(), token, showName, locale),
);
