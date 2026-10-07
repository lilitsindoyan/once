import { route } from "@/lib/api";
import { requireAdmin } from "@/server/admin/auth";
import { exportCustomersCsv } from "@/server/admin/customers";

export const GET = route(null, async () => {
  const csv = await exportCustomersCsv(await requireAdmin());
  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="once-customers.csv"' },
  });
});
