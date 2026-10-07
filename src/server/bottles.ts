import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { canonicalSerial } from "@/lib/crypto";
import type { User } from "@prisma/client";

export type PassportField = { key: string; label: Record<string, string>; type?: "text" | "date" | "longtext" };

/** Flow 3: only bottles the user owns right now. */
export async function listMyBottles(userId: string) {
  const bottles = await db.bottle.findMany({
    where: { currentOwnerId: userId, status: "OWNED" },
    include: { series: true },
    orderBy: { claimedAt: "desc" },
  });
  return bottles.map((b) => ({
    serial: b.serial,
    series: b.series.name,
    batch: b.series.batchNumber,
    claimedAt: b.claimedAt,
  }));
}

/** Ownership history line: "12 Mar 2027 – 04 Sep 2028 · Anonymous owner". name = null → anonymous. */
export type HistoryEntry = { from: Date; to: Date | null; name: string | null; isYou: boolean };

/**
 * Flow 3, passport. Visible to the current owner only; the hidden code is never included.
 */
export async function getPassport(user: User, rawSerial: string) {
  const serial = canonicalSerial(rawSerial);
  if (!serial) throw new AppError("not_found");
  const bottle = await db.bottle.findFirst({
    where: { serial, currentOwnerId: user.id, status: "OWNED" },
    include: {
      series: true,
      periods: { include: { user: true }, orderBy: { startedAt: "asc" } },
    },
  });
  if (!bottle) throw new AppError("not_found");

  const template = (bottle.series.passportTemplate as PassportField[]) ?? [];
  const values = {
    ...((bottle.series.passportDefaults as Record<string, string>) ?? {}),
    ...Object.fromEntries(Object.entries((bottle.passportValues as Record<string, string>) ?? {}).filter(([, v]) => v)),
  };
  const current = bottle.periods.find((p) => p.endedAt === null && p.userId === user.id);

  return {
    serial: bottle.serial,
    series: bottle.series.name,
    batch: bottle.series.batchNumber,
    productionDate: bottle.series.productionDate,
    claimedAt: bottle.claimedAt,
    showName: current?.showName ?? true,
    fields: template.map((f) => ({ key: f.key, label: f.label, type: f.type ?? "text", value: values[f.key] ?? "" })),
    history: bottle.periods.map<HistoryEntry>((p) => ({
      from: p.startedAt,
      to: p.endedAt,
      name: p.showName ? `${p.user.firstName} ${p.user.lastName}` : null,
      isYou: p.userId === user.id && p.endedAt === null,
    })),
  };
}
