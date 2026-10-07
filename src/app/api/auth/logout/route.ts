import { route } from "@/lib/api";
import { logout } from "@/server/auth";

export const POST = route(null, async () => {
  await logout();
  return { ok: true };
});
