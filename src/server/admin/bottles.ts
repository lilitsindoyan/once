import "server-only";
import { db, type Tx } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { decrypt, randomToken, sha256 } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { anonymousLabel } from "../transfer";
import { findOpenAccount, normalizeEmail } from "../auth";
import { ensureCountryPin } from "../pins";
import { audit } from "./auth";
import type { AdminUser, BottleStatus, Prisma } from "@prisma/client";

const PAGE = 50;

export async function listBottles(f: { q?: string; status?: BottleStatus; seriesId?: string; page?: number }) {
  const page = f.page ?? 1;
  const where: Prisma.BottleWhereInput = {
    ...(f.status ? { status: f.status } : {}),
    ...(f.seriesId ? { seriesId: f.seriesId } : {}),
    ...(f.q
      ? {
          OR: [
            { serial: { contains: f.q.trim().toUpperCase() } },
            { currentOwner: { email: { contains: f.q.trim().toLowerCase() } } },
            { currentOwner: { lastName: { contains: f.q.trim(), mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.bottle.count({ where }),
    db.bottle.findMany({
      where,
      include: { series: true, currentOwner: true, transfers: { where: { status: "PENDING" } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / PAGE)), rows };
}

/** ToR 5.2.2: passport, hidden code, full history with real names, transfer records. */
export async function bottleDetail(admin: AdminUser, id: string) {
  const bottle = await db.bottle.findUnique({
    where: { id },
    include: {
      series: true,
      currentOwner: true,
      periods: { include: { user: true }, orderBy: { startedAt: "asc" } },
      transfers: { include: { sender: true, recipient: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!bottle) throw new AppError("not_found");
  await audit(admin.id, "bottle.view", "Bottle", id);
  return { ...bottle, hiddenCode: decrypt(bottle.hiddenCodeEnc) };
}

export async function updatePassportValues(admin: AdminUser, id: string, values: Record<string, string>) {
  await db.bottle.update({ where: { id }, data: { passportValues: values } });
  await audit(admin.id, "bottle.passport", "Bottle", id);
}

async function pendingTransfer(tx: Tx, bottleId: string) {
  const t = await tx.transfer.findFirst({
    where: { bottleId, status: "PENDING" },
    include: { bottle: { include: { series: true } }, sender: true },
  });
  if (!t) throw new AppError("bottle_not_in_transfer");
  return t;
}

/**
 * Cancel a transfer: the bottle returns to the sender and their ownership period reopens.
 * A closed sender account is reopened — unless the person has since opened a new account with the
 * same email; then the bottle goes to that newer account (only one open account per email).
 */
export async function cancelTransfer(admin: AdminUser, bottleId: string) {
  const t = await db.$transaction(async (tx) => {
    const transfer = await pendingTransfer(tx, bottleId);
    await tx.transfer.update({ where: { id: transfer.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });

    let ownerId = transfer.senderId;
    if (transfer.sender.status === "CLOSED") {
      const newer = await tx.user.findFirst({ where: { email: transfer.sender.email, status: { not: "CLOSED" } } });
      if (newer) ownerId = newer.id;
      else await tx.user.update({ where: { id: transfer.senderId }, data: { status: "ACTIVE", closedAt: null } });
    }

    if (ownerId === transfer.senderId) {
      const last = await tx.ownershipPeriod.findFirst({
        where: { bottleId, userId: transfer.senderId },
        orderBy: { startedAt: "desc" },
      });
      if (last) await tx.ownershipPeriod.update({ where: { id: last.id }, data: { endedAt: null } });
    } else {
      await tx.ownershipPeriod.create({ data: { bottleId, userId: ownerId, showName: false } });
    }
    await tx.bottle.update({ where: { id: bottleId }, data: { status: "OWNED", currentOwnerId: ownerId } });
    return transfer;
  });

  await audit(admin.id, "transfer.cancel", "Bottle", bottleId, { transferId: t.id });
  for (const [to, locale] of [
    [t.sender.email, t.sender.locale],
    [t.recipientEmail, t.sender.locale],
  ]) {
    await sendEmail({ to, key: "transfer_cancelled", locale, vars: { serial: t.bottle.serial } });
  }
}

async function sendInvite(
  t: { bottleId: string; senderId: string; recipientEmail: string; bottle: { serial: string; series: { name: string } } },
  token: string,
  locale: string,
) {
  const period = await db.ownershipPeriod.findFirst({
    where: { bottleId: t.bottleId, userId: t.senderId },
    orderBy: { startedAt: "desc" },
    include: { user: true },
  });
  await sendEmail({
    to: t.recipientEmail,
    key: "transfer_invite",
    locale,
    vars: {
      serial: t.bottle.serial,
      series: t.bottle.series.name,
      sender: period?.showName ? `${period.user.firstName} ${period.user.lastName}` : anonymousLabel(locale),
      link: `${env.APP_URL}/${locale}/accept/${token}`,
    },
  });
}

/** Resend the invitation. Only the token hash is stored, so a fresh link replaces the old one. */
export async function resendInvite(admin: AdminUser, bottleId: string) {
  const token = randomToken();
  const t = await db.$transaction(async (tx) => {
    const transfer = await pendingTransfer(tx, bottleId);
    await tx.transfer.update({ where: { id: transfer.id }, data: { tokenHash: sha256(token) } });
    return transfer;
  });
  await sendInvite(t, token, t.sender.locale);
  await audit(admin.id, "transfer.resend", "Bottle", bottleId, { transferId: t.id });
}

/**
 * Reassign (customer service).
 *  - In Transfer: the pending transfer is redirected to a new email (new link).
 *  - Owned: the bottle moves to the account with that email; with no such account, a transfer
 *    invitation is sent to it on the current owner's behalf.
 */
export async function reassignBottle(admin: AdminUser, bottleId: string, rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const bottle = await db.bottle.findUniqueOrThrow({ where: { id: bottleId }, include: { series: true } });

  if (bottle.status === "IN_TRANSFER") {
    const token = randomToken();
    const created = await db.$transaction(async (tx) => {
      const old = await pendingTransfer(tx, bottleId);
      await tx.transfer.update({ where: { id: old.id }, data: { status: "REASSIGNED", cancelledAt: new Date() } });
      return tx.transfer.create({
        data: { bottleId, senderId: old.senderId, recipientEmail: email, tokenHash: sha256(token) },
        include: { bottle: { include: { series: true } }, sender: true },
      });
    });
    await sendInvite(created, token, created.sender.locale);
    await audit(admin.id, "transfer.reassign", "Bottle", bottleId, { email });
    return;
  }

  if (bottle.status !== "OWNED" || !bottle.currentOwnerId) throw new AppError("bottle_state");
  const fromId = bottle.currentOwnerId;
  const target = await findOpenAccount(email);
  if (target?.id === fromId) throw new AppError("invalid_input", { field: "email" });

  if (target) {
    await db.$transaction(async (tx) => {
      await tx.ownershipPeriod.updateMany({ where: { bottleId, endedAt: null }, data: { endedAt: new Date() } });
      await tx.ownershipPeriod.create({ data: { bottleId, userId: target.id, showName: false } });
      await tx.bottle.update({ where: { id: bottleId }, data: { currentOwnerId: target.id, claimedAt: new Date() } });
      await ensureCountryPin(tx, target.country);
      const left = await tx.bottle.count({ where: { currentOwnerId: fromId, status: "OWNED" } });
      if (left === 0) await tx.user.update({ where: { id: fromId }, data: { status: "CLOSED", closedAt: new Date() } });
    });
    await audit(admin.id, "bottle.reassign", "Bottle", bottleId, { from: fromId, to: target.id });
    return;
  }

  const token = randomToken();
  const created = await db.$transaction(async (tx) => {
    await tx.bottle.update({ where: { id: bottleId }, data: { status: "IN_TRANSFER", currentOwnerId: null } });
    await tx.ownershipPeriod.updateMany({ where: { bottleId, endedAt: null }, data: { endedAt: new Date() } });
    const t = await tx.transfer.create({
      data: { bottleId, senderId: fromId, recipientEmail: email, tokenHash: sha256(token) },
      include: { bottle: { include: { series: true } }, sender: true },
    });
    const left = await tx.bottle.count({ where: { currentOwnerId: fromId, status: "OWNED" } });
    if (left === 0) await tx.user.update({ where: { id: fromId }, data: { status: "CLOSED", closedAt: new Date() } });
    return t;
  });
  await sendInvite(created, token, created.sender.locale);
  await audit(admin.id, "bottle.reassign_invite", "Bottle", bottleId, { email });
}

export async function setDeactivated(admin: AdminUser, bottleId: string, deactivate: boolean) {
  const bottle = await db.bottle.findUniqueOrThrow({ where: { id: bottleId } });
  if (deactivate) {
    if (bottle.status === "DEACTIVATED") return;
    await db.bottle.update({
      where: { id: bottleId },
      data: { status: "DEACTIVATED", statusBeforeDeactivation: bottle.status },
    });
  } else {
    if (bottle.status !== "DEACTIVATED") return;
    await db.bottle.update({
      where: { id: bottleId },
      data: { status: bottle.statusBeforeDeactivation ?? "UNCLAIMED", statusBeforeDeactivation: null },
    });
  }
  await audit(admin.id, deactivate ? "bottle.deactivate" : "bottle.reactivate", "Bottle", bottleId);
}
