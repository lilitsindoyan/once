import { route } from "@/lib/api";
import { getTransferByToken } from "@/server/transfer";

/** Accept page data. The invited email itself is not returned, only a masked hint. */
export const GET = route(null, async (_b, _r, { token }: { token: string }) => {
  const t = await getTransferByToken(token);
  if (t.state !== "pending") return t;
  const { invitedEmail: _hidden, ...rest } = t;
  void _hidden;
  return rest;
});
