import { route } from "@/lib/api";
import { db } from "@/lib/db";

/** Public map pins (for the landing map, built separately). */
export const GET = route(null, async () => ({
  pins: await db.mapPin.findMany({ where: { visible: true }, select: { countryCode: true, lat: true, lng: true } }),
}));
