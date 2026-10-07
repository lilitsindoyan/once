import { z } from "zod";
import { route, zEmail, zLocale } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { startTransfer } from "@/server/transfer";

/** Flow 4: the sender loses access as soon as this succeeds. */
export const POST = route(
  z.object({ showName: z.boolean(), email: zEmail, emailConfirm: zEmail, locale: zLocale }),
  async (body, _req, { serial }: { serial: string }) => startTransfer(await requireUser(), { ...body, serial }),
);
