import { route } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { getPassport } from "@/server/bottles";

export const GET = route(null, async (_b, _r, { serial }: { serial: string }) =>
  getPassport(await requireUser(), serial),
);
