import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

/**
 * Public Bottle Owners page (ToR 3.1.4): current owners who chose Show my name,
 * newest first, searchable by name or serial. Anonymous owners and admin-hidden entries are left out.
 */
export async function listOwners(search: string | undefined, page = 1) {
  const q = search?.trim();
  const words = q ? q.split(/\s+/).filter(Boolean) : [];
  const where: Prisma.OwnershipPeriodWhereInput = {
    endedAt: null,
    showName: true,
    hiddenByAdmin: false,
    user: { status: "ACTIVE" },
    bottle: { status: "OWNED" },
    ...(words.length
      ? {
          AND: words.map((w) => ({
            OR: [
              { user: { firstName: { contains: w, mode: "insensitive" as const } } },
              { user: { lastName: { contains: w, mode: "insensitive" as const } } },
              { bottle: { serial: { contains: w.toUpperCase() } } },
            ],
          })),
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.ownershipPeriod.count({ where }),
    db.ownershipPeriod.findMany({
      where,
      include: { user: true, bottle: true },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    rows: rows.map((r) => ({
      name: `${r.user.firstName} ${r.user.lastName}`,
      country: r.user.country,
      serial: r.bottle.serial,
      since: r.startedAt,
    })),
  };
}
