import { route } from "@/lib/api";
import { requireAdmin } from "@/server/admin/auth";
import { generalQrPng } from "@/server/admin/series";

/** The one general QR code for packaging (PNG, links to /claim). */
export const GET = route(null, async () => {
  await requireAdmin();
  return new Response(new Uint8Array(await generalQrPng()), {
    headers: { "Content-Type": "image/png", "Content-Disposition": 'attachment; filename="once-claim-qr.png"' },
  });
});
