import "server-only";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { decrypt, encrypt, generateHiddenCode, generateSerial } from "@/lib/crypto";
import type { PassportField } from "../bottles";
import { audit } from "./auth";
import type { AdminUser } from "@prisma/client";

export const MAX_SERIES_QUANTITY = 10_000;

/**
 * ToR 5.2.1: create a series and generate a unique, non-sequential serial + hidden code per bottle.
 */
export async function createSeries(
  admin: AdminUser,
  input: { name: string; batchNumber: string; quantity: number; productionDate?: string; template: PassportField[] },
) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_SERIES_QUANTITY) {
    throw new AppError("invalid_input", { field: "quantity" });
  }

  // Generate serials that are unique within this batch and against the database.
  const serials = new Set<string>();
  while (serials.size < input.quantity) serials.add(generateSerial());
  const clashes = await db.bottle.findMany({ where: { serial: { in: [...serials] } }, select: { serial: true } });
  for (const c of clashes) {
    serials.delete(c.serial);
    let s = generateSerial();
    while (serials.has(s)) s = generateSerial();
    serials.add(s);
  }

  const series = await db.$transaction(async (tx) => {
    const created = await tx.series.create({
      data: {
        name: input.name.trim(),
        batchNumber: input.batchNumber.trim(),
        quantity: input.quantity,
        productionDate: input.productionDate ? new Date(input.productionDate) : null,
        passportTemplate: input.template,
      },
    });
    await tx.bottle.createMany({
      data: [...serials].map((serial) => ({
        serial,
        hiddenCodeEnc: encrypt(generateHiddenCode()),
        seriesId: created.id,
      })),
    });
    return created;
  }, { timeout: 60_000 });

  await audit(admin.id, "series.create", "Series", series.id, { quantity: input.quantity });
  return series;
}

export async function updateSeriesTemplate(admin: AdminUser, seriesId: string, template: PassportField[]) {
  await db.series.update({ where: { id: seriesId }, data: { passportTemplate: template } });
  await audit(admin.id, "series.template", "Series", seriesId);
}

export async function updateSeriesDefaults(admin: AdminUser, seriesId: string, values: Record<string, string>) {
  await db.series.update({ where: { id: seriesId }, data: { passportDefaults: values } });
  await audit(admin.id, "series.defaults", "Series", seriesId);
}

export async function listSeries() {
  const series = await db.series.findMany({ orderBy: { createdAt: "desc" } });
  const counts = await db.bottle.groupBy({ by: ["seriesId", "status"], _count: true });
  return series.map((s) => ({
    ...s,
    counts: Object.fromEntries(counts.filter((c) => c.seriesId === s.id).map((c) => [c.status, c._count])),
  }));
}

/** Production export: serial + hidden code per bottle (CSV). Logged, as it reveals hidden codes. */
export async function exportSeriesCsv(admin: AdminUser, seriesId: string) {
  const series = await db.series.findUniqueOrThrow({ where: { id: seriesId } });
  const bottles = await db.bottle.findMany({ where: { seriesId }, orderBy: { createdAt: "asc" } });
  await audit(admin.id, "series.export", "Series", seriesId);
  const rows = bottles.map((b) => `${b.serial},${decrypt(b.hiddenCodeEnc)}`);
  return { filename: `once-${series.batchNumber}-codes.csv`, csv: ["serial,hidden_code", ...rows].join("\n") };
}

/** The one general QR code, pointing to the Claim page (ToR 4). */
export async function generalQrPng(): Promise<Buffer> {
  return QRCode.toBuffer(`${env.APP_URL}/claim`, { width: 1024, margin: 2 });
}
