import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { isCountryCode } from "@/lib/capitals";
import { findOpenAccount, normalizeEmail } from "../auth";
import { audit } from "./auth";
import type { AccountStatus, AdminUser, Prisma } from "@prisma/client";

const PAGE = 50;

function where(f: { q?: string; status?: AccountStatus; country?: string }): Prisma.UserWhereInput {
  const q = f.q?.trim();
  return {
    ...(f.status ? { status: f.status } : {}),
    ...(f.country ? { country: f.country } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q.toLowerCase() } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/** ToR 5.3: closed and new accounts with the same email are separate rows. */
export async function listCustomers(f: { q?: string; status?: AccountStatus; country?: string; page?: number }) {
  const page = f.page ?? 1;
  const w = where(f);
  const [total, rows] = await Promise.all([
    db.user.count({ where: w }),
    db.user.findMany({
      where: w,
      include: { _count: { select: { bottles: { where: { status: "OWNED" } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / PAGE)), rows };
}

export async function customerDetail(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      periods: { include: { bottle: { include: { series: true } } }, orderBy: { startedAt: "desc" } },
      transfersSent: { include: { bottle: true }, orderBy: { createdAt: "desc" } },
      transfersReceived: { include: { bottle: true, sender: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) throw new AppError("not_found");
  const sameEmail = await db.user.findMany({
    where: { email: user.email, id: { not: user.id } },
    select: { id: true, status: true, createdAt: true },
  });
  return { ...user, sameEmail };
}

export async function updateCustomer(
  admin: AdminUser,
  id: string,
  input: { firstName: string; lastName: string; email: string; country: string },
) {
  if (!isCountryCode(input.country)) throw new AppError("invalid_input", { field: "country" });
  const email = normalizeEmail(input.email);
  const before = await db.user.findUniqueOrThrow({ where: { id } });
  if (email !== before.email && before.status !== "CLOSED") {
    const other = await findOpenAccount(email);
    if (other && other.id !== id) throw new AppError("email_in_use");
  }
  await db.user.update({
    where: { id },
    data: { firstName: input.firstName.trim(), lastName: input.lastName.trim(), email, country: input.country },
  });
  await audit(admin.id, "customer.update", "User", id, {
    before: { firstName: before.firstName, lastName: before.lastName, email: before.email, country: before.country },
    after: { ...input, email },
  });
}

/** Suspend / unsuspend / close. Closing needs the account to hold no bottles. */
export async function setCustomerStatus(admin: AdminUser, id: string, status: AccountStatus) {
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (status === "CLOSED") {
    const owned = await db.bottle.count({ where: { currentOwnerId: id, status: { in: ["OWNED", "DEACTIVATED"] } } });
    if (owned > 0) throw new AppError("bottle_state", { reason: "has_bottles" });
  }
  if (status !== "CLOSED" && user.status === "CLOSED") {
    const other = await findOpenAccount(user.email);
    if (other) throw new AppError("email_in_use");
  }
  await db.user.update({
    where: { id },
    data: { status, closedAt: status === "CLOSED" ? new Date() : null },
  });
  await audit(admin.id, `customer.${status.toLowerCase()}`, "User", id);
}

const csvCell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportCustomersCsv(admin: AdminUser) {
  const users = await db.user.findMany({
    include: { bottles: { where: { status: "OWNED" }, select: { serial: true } } },
    orderBy: { createdAt: "asc" },
  });
  await audit(admin.id, "customer.export", "User", "*");
  const head = "id,email,first_name,last_name,country,status,registered,closed,bottles_owned,serials";
  const rows = users.map((u) =>
    [u.id, u.email, u.firstName, u.lastName, u.country, u.status, u.createdAt, u.closedAt, u.bottles.length, u.bottles.map((b) => b.serial).join(" ")]
      .map(csvCell)
      .join(","),
  );
  return [head, ...rows].join("\n");
}

export async function exportOwnershipCsv(admin: AdminUser) {
  const periods = await db.ownershipPeriod.findMany({
    include: { bottle: { include: { series: true } }, user: true },
    orderBy: [{ bottleId: "asc" }, { startedAt: "asc" }],
  });
  await audit(admin.id, "ownership.export", "OwnershipPeriod", "*");
  const head = "serial,series,owner_email,owner_name,country,from,to,shown_as";
  const rows = periods.map((p) =>
    [p.bottle.serial, p.bottle.series.name, p.user.email, `${p.user.firstName} ${p.user.lastName}`, p.user.country, p.startedAt, p.endedAt, p.showName ? "name" : "anonymous"]
      .map(csvCell)
      .join(","),
  );
  return [head, ...rows].join("\n");
}
