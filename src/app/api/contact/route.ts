import { z } from "zod";
import { clientKey, route, zEmail, zLocale } from "@/lib/api";
import { saveContactMessage } from "@/server/landing";

/** Landing Contact form (Figma frame 119). Stored and shown in the admin panel. */
export const POST = route(
  z.object({
    name: z.string().trim().min(1).max(120),
    email: zEmail,
    message: z.string().trim().min(1).max(4000),
    locale: zLocale,
  }),
  async (body) => {
    await saveContactMessage(body, await clientKey());
    return { ok: true };
  },
);
