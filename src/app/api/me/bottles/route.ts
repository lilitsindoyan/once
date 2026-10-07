import { route } from "@/lib/api";
import { requireUser } from "@/server/auth";
import { listMyBottles } from "@/server/bottles";

export const GET = route(null, async () => ({ bottles: await listMyBottles((await requireUser()).id) }));
