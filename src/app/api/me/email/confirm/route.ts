import { z } from "zod";
import { route, zEmail } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { confirmEmailChange } from "@/server/profile";

export const POST = route(
  z.object({ email: zEmail, code: z.string().trim().regex(/^\d{6}$/) }),
  async ({ email, code }) => {
    await confirmEmailChange(await requireUser(), email, code);
    return { ok: true };
  },
);
