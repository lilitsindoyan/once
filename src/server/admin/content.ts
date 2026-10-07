import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { CAPITALS } from "@/lib/capitals";
import { DEFAULT_EMAILS, EMAIL_KEYS, type EmailKey } from "@/lib/email-defaults";
import { audit } from "./auth";
import type { AdminUser } from "@prisma/client";

const LOCALES = ["hy", "en", "ru"] as const;

/* ---------- Bottle Owners entries (ToR 5.4: hide individual entries) ---------- */

export async function listOwnerEntries() {
  return db.ownershipPeriod.findMany({
    where: { endedAt: null, showName: true, bottle: { status: "OWNED" } },
    include: { user: true, bottle: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function setOwnerEntryHidden(admin: AdminUser, periodId: string, hidden: boolean) {
  await db.ownershipPeriod.update({ where: { id: periodId }, data: { hiddenByAdmin: hidden } });
  await audit(admin.id, hidden ? "owners.hide" : "owners.show", "OwnershipPeriod", periodId);
}

/* ---------- Map pins (ToR 5.4: add, move or hide) ---------- */

export async function listPins() {
  const [pins, counts] = await Promise.all([
    db.mapPin.findMany({ orderBy: { countryCode: "asc" } }),
    db.user.groupBy({ by: ["country"], where: { status: "ACTIVE", bottles: { some: { status: "OWNED" } } }, _count: true }),
  ]);
  const owners = Object.fromEntries(counts.map((c) => [c.country, c._count]));
  return pins.map((p) => ({ ...p, owners: owners[p.countryCode] ?? 0 }));
}

export async function savePin(admin: AdminUser, input: { countryCode: string; lat?: number; lng?: number; visible: boolean }) {
  const cap = CAPITALS[input.countryCode];
  if (!cap) throw new AppError("invalid_input", { field: "countryCode" });
  const lat = input.lat ?? cap[0];
  const lng = input.lng ?? cap[1];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new AppError("invalid_input", { field: "coords" });
  await db.mapPin.upsert({
    where: { countryCode: input.countryCode },
    update: { lat, lng, visible: input.visible },
    create: { countryCode: input.countryCode, lat, lng, visible: input.visible, source: "MANUAL" },
  });
  await audit(admin.id, "pin.save", "MapPin", input.countryCode, { lat, lng, visible: input.visible });
}

/* ---------- Email templates (ToR 5.4) ---------- */

export async function listEmailTemplates() {
  const stored = await db.emailTemplate.findMany();
  return EMAIL_KEYS.map((key) => ({
    key,
    locales: Object.fromEntries(
      LOCALES.map((l) => {
        const s = stored.find((t) => t.key === key && t.locale === l);
        return [l, { subject: s?.subject ?? DEFAULT_EMAILS[key][l].subject, body: s?.body ?? DEFAULT_EMAILS[key][l].body, custom: !!s }];
      }),
    ) as Record<(typeof LOCALES)[number], { subject: string; body: string; custom: boolean }>,
  }));
}

export async function saveEmailTemplate(admin: AdminUser, key: EmailKey, locale: string, subject: string, body: string) {
  if (!EMAIL_KEYS.includes(key) || !LOCALES.includes(locale as never)) throw new AppError("invalid_input");
  await db.emailTemplate.upsert({
    where: { key_locale: { key, locale } },
    update: { subject, body },
    create: { key, locale, subject, body },
  });
  await audit(admin.id, "email.save", "EmailTemplate", `${key}:${locale}`);
}

/* ---------- Language strings (ToR 5.4) ---------- */

export async function saveLanguageString(admin: AdminUser, key: string, locale: string, value: string) {
  if (!LOCALES.includes(locale as never)) throw new AppError("invalid_input");
  if (value.trim() === "") {
    await db.languageString.deleteMany({ where: { key, locale } });
  } else {
    await db.languageString.upsert({
      where: { key_locale: { key, locale } },
      update: { value },
      create: { key, locale, value },
    });
  }
  await audit(admin.id, "string.save", "LanguageString", `${key}:${locale}`);
}

/* ---------- Analytics (ToR 5.5) ---------- */

export async function analytics() {
  const day = 24 * 60 * 60 * 1000;
  const since = (ms: number) => new Date(Date.now() - ms);
  const [total, claimed, regDay, regWeek, regMonth, sent, completed, pending, byCountry] = await Promise.all([
    db.bottle.count(),
    db.bottle.count({ where: { status: { in: ["OWNED", "IN_TRANSFER"] } } }),
    db.user.count({ where: { createdAt: { gt: since(day) } } }),
    db.user.count({ where: { createdAt: { gt: since(7 * day) } } }),
    db.user.count({ where: { createdAt: { gt: since(30 * day) } } }),
    db.transfer.count(),
    db.transfer.count({ where: { status: "ACCEPTED" } }),
    db.transfer.count({ where: { status: "PENDING" } }),
    db.user.groupBy({
      by: ["country"],
      where: { status: "ACTIVE", bottles: { some: { status: "OWNED" } } },
      _count: true,
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
  ]);
  return {
    bottles: { total, claimed },
    registrations: { day: regDay, week: regWeek, month: regMonth },
    transfers: { sent, completed, pending },
    topCountries: byCountry.map((c) => ({ country: c.country, owners: c._count })),
  };
}
