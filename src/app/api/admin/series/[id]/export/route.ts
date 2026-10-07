import { route } from "@/lib/api";
import { requireAdmin } from "@/server/admin/auth";
import { exportSeriesCsv } from "@/server/admin/series";

/** Production export: serial + hidden code per bottle. */
export const GET = route(null, async (_b, _r, { id }: { id: string }) => {
  const { filename, csv } = await exportSeriesCsv(await requireAdmin("SUPER_ADMIN"), id);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
  });
});
