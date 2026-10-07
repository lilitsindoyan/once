import "server-only";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { canonicalHiddenCode, canonicalSerial, decrypt, safeEqual } from "@/lib/crypto";
import { clearCookie, readCookie, setCookie, type ClaimToken } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { ensureCountryPin } from "./pins";
import type { User } from "@prisma/client";

export type ClaimSummary = { serial: string; series: string; batch: string; productionDate: string | null };

function summary(bottle: { serial: string; series: { name: string; batchNumber: string; productionDate: Date | null } }): ClaimSummary {
  return {
    serial: bottle.serial,
    series: bottle.series.name,
    batch: bottle.series.batchNumber,
    productionDate: bottle.series.productionDate?.toISOString() ?? null,
  };
}

/** Points to confirm (ToR 8.8): 5 wrong attempts → 15-minute block. */
const MAX_FAILURES = 5;
const BLOCK_WINDOW_MS = 15 * 60 * 1000;

async function assertNotBlocked(clientKey: string) {
  const failures = await db.claimAttempt.count({
    where: { clientKey, success: false, createdAt: { gt: new Date(Date.now() - BLOCK_WINDOW_MS) } },
  });
  if (failures >= MAX_FAILURES) throw new AppError("claim_blocked", { minutes: 15 });
}

/**
 * Flow 2, steps 2–3 (ToR 4.1). Checked before login so nobody registers for a bottle they can't claim.
 * "Not found" and "wrong code" return the same error so serial numbers can't be probed.
 */
export async function checkClaim(rawSerial: string, rawCode: string, clientKey: string) {
  await assertNotBlocked(clientKey);

  const serial = canonicalSerial(rawSerial);
  const code = canonicalHiddenCode(rawCode);
  const bottle = serial ? await db.bottle.findUnique({ where: { serial }, include: { series: true } }) : null;

  if (!bottle || !code || !safeEqual(decrypt(bottle.hiddenCodeEnc), code)) {
    await db.claimAttempt.create({ data: { clientKey, success: false } });
    throw new AppError("claim_incorrect");
  }
  await db.claimAttempt.create({ data: { clientKey, success: true } });

  if (bottle.status === "OWNED" || bottle.status === "IN_TRANSFER") throw new AppError("claim_already_registered");
  if (bottle.status === "DEACTIVATED") throw new AppError("claim_deactivated");

  await setCookie("claim", { bottleId: bottle.id });
  return summary(bottle);
}

/** The bottle remembered by the claim check (survives the login / registration detour). */
export async function getPendingClaim() {
  const token = await readCookie<ClaimToken>("claim");
  if (!token) return null;
  const bottle = await db.bottle.findUnique({ where: { id: token.bottleId }, include: { series: true } });
  if (!bottle || bottle.status !== "UNCLAIMED") return null;
  return summary(bottle);
}

/** Flow 2, steps 5–7. */
export async function claimBottle(user: User, showName: boolean, locale: string) {
  const token = await readCookie<ClaimToken>("claim");
  if (!token) throw new AppError("claim_expired");

  const bottle = await db.$transaction(async (tx) => {
    // Guard against two people claiming at the same moment.
    const updated = await tx.bottle.updateMany({
      where: { id: token.bottleId, status: "UNCLAIMED" },
      data: { status: "OWNED", currentOwnerId: user.id, claimedAt: new Date() },
    });
    if (updated.count !== 1) throw new AppError("claim_already_registered");

    await tx.ownershipPeriod.create({ data: { bottleId: token.bottleId, userId: user.id, showName } });
    await ensureCountryPin(tx, user.country);
    return tx.bottle.findUniqueOrThrow({ where: { id: token.bottleId }, include: { series: true } });
  });

  await clearCookie("claim");
  await sendEmail({
    to: user.email,
    key: "claim",
    locale,
    vars: {
      serial: bottle.serial,
      series: bottle.series.name,
      link: `${env.APP_URL}/${locale}/my-bottles/${bottle.serial}`,
    },
  });
  return { serial: bottle.serial };
}
