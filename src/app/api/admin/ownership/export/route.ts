import { route } from "@/lib/api";
import { requireAdmin } from "@/server/admin/auth";
import { exportOwnershipCsv } from "@/server/admin/customers";

export const GET = route(null, async () => {
  const csv = await exportOwnershipCsv(await requireAdmin());
  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="once-ownership.csv"' },
  });
});
