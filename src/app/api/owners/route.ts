import { z } from "zod";
import { route } from "@/lib/api";
import { listOwners } from "@/server/owners";

export const GET = route(
  z.object({ q: z.string().max(80).optional(), page: z.coerce.number().int().min(1).default(1) }),
  async ({ q, page }) => listOwners(q, page),
);
