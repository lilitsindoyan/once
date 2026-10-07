import { z } from "zod";
import { route, zLocale, zName } from "@/lib/api";
import { register } from "@/server/auth";

export const POST = route(
  z.object({ firstName: zName, lastName: zName, country: z.string().length(2), locale: zLocale }),
  async (input) => {
    await register(input);
    return { ok: true };
  },
);
