import "server-only";
import type { Tx } from "@/lib/db";
import { CAPITALS } from "@/lib/capitals";

/**
 * Adds a map pin on the capital of the owner's country if that country has none yet.
 * A pin the admin hid or moved is left as it is.
 */
export async function ensureCountryPin(tx: Tx, countryCode: string) {
  const coords = CAPITALS[countryCode];
  if (!coords) return;
  await tx.mapPin.upsert({
    where: { countryCode },
    update: {},
    create: { countryCode, lat: coords[0], lng: coords[1], source: "AUTO" },
  });
}
