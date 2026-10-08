import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

export type LandingPin = {
  countryCode: string;
  lat: number;
  lng: number;
  /** Bottles currently owned in this country. */
  count: number;
  /** Most recently claimed bottle there (serial and series are public, like on the Owners page). */
  latest: { serial: string; series: string; claimedAt: string } | null;
};

/** Landing map (Figma frame 117): visible pins, each with its newest claimed bottle. */
export async function landingPins(): Promise<LandingPin[]> {
  const pins = await db.mapPin.findMany({ where: { visible: true }, select: { countryCode: true, lat: true, lng: true } });
  if (pins.length === 0) return [];

  const current = await db.ownershipPeriod.findMany({
    where: {
      endedAt: null,
      user: { status: "ACTIVE", country: { in: pins.map((p) => p.countryCode) } },
      bottle: { status: "OWNED" },
    },
    select: { startedAt: true, user: { select: { country: true } }, bottle: { select: { serial: true, series: { select: { name: true } } } } },
    orderBy: { startedAt: "desc" },
  });

  const byCountry = new Map<string, { count: number; latest: LandingPin["latest"] }>();
  for (const p of current) {
    const c = p.user.country;
    const entry = byCountry.get(c);
    if (entry) entry.count += 1;
    else
      byCountry.set(c, {
        count: 1,
        latest: { serial: p.bottle.serial, series: p.bottle.series.name, claimedAt: p.startedAt.toISOString() },
      });
  }

  return pins.map((p) => ({ ...p, count: byCountry.get(p.countryCode)?.count ?? 0, latest: byCountry.get(p.countryCode)?.latest ?? null }));
}

const CONTACT_PER_HOUR = 5;

/** Landing Contact form → stored for the admin panel. Limited per client to keep spam out. */
export async function saveContactMessage(input: { name: string; email: string; message: string; locale: string }, clientKey: string) {
  const recent = await db.contactMessage.count({
    where: { clientKey, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= CONTACT_PER_HOUR) throw new AppError("rate_limited");
  await db.contactMessage.create({ data: { ...input, email: input.email.trim().toLowerCase(), clientKey } });
}
