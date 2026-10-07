import "server-only";
import { db, type Tx } from "@/lib/db";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { canonicalSerial, maskEmail, randomToken, sha256 } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";
import { logout, normalizeEmail } from "./auth";
import { ensureCountryPin } from "./pins";
import type { User } from "@prisma/client";

const linkFor = (token: string, locale: string) => `${env.APP_URL}/${locale}/accept/${token}`;

/** Label the recipient sees: the sender's name, or null for "Anonymous owner". */
async function senderLabel(tx: Tx | typeof db, bottleId: string, senderId: string): Promise<string | null> {
  const period = await tx.ownershipPeriod.findFirst({
    where: { bottleId, userId: senderId },
    orderBy: { startedAt: "desc" },
    include: { user: true },
  });
  return period?.showName ? `${period.user.firstName} ${period.user.lastName}` : null;
}

/**
 * Flow 4 (sender). On confirm the sender loses the bottle immediately; if it was their last
 * bottle the account is closed (soft delete) and the session ends.
 */
export async function startTransfer(
  user: User,
  input: { serial: string; showName: boolean; email: string; emailConfirm: string; locale: string },
) {
  const recipientEmail = normalizeEmail(input.email);
  if (recipientEmail !== normalizeEmail(input.emailConfirm)) throw new AppError("transfer_email_mismatch");
  if (recipientEmail === user.email) throw new AppError("transfer_own_email");
  const serial = canonicalSerial(input.serial);
  if (!serial) throw new AppError("not_found");

  const token = randomToken();
  const result = await db.$transaction(async (tx) => {
    const bottle = await tx.bottle.findFirst({
      where: { serial, currentOwnerId: user.id, status: "OWNED" },
      include: { series: true },
    });
    if (!bottle) throw new AppError("transfer_not_owner");

    await tx.bottle.update({ where: { id: bottle.id }, data: { status: "IN_TRANSFER", currentOwnerId: null } });
    // Close the sender's ownership period with the privacy choice confirmed at transfer.
    await tx.ownershipPeriod.updateMany({
      where: { bottleId: bottle.id, userId: user.id, endedAt: null },
      data: { endedAt: new Date(), showName: input.showName },
    });
    await tx.transfer.create({
      data: { bottleId: bottle.id, senderId: user.id, recipientEmail, tokenHash: sha256(token) },
    });

    const remaining = await tx.bottle.count({ where: { currentOwnerId: user.id, status: "OWNED" } });
    if (remaining === 0) {
      await tx.user.update({ where: { id: user.id }, data: { status: "CLOSED", closedAt: new Date() } });
    }
    return { bottle, accountClosed: remaining === 0 };
  });

  const sender = input.showName ? `${user.firstName} ${user.lastName}` : null;
  await sendEmail({
    to: recipientEmail,
    key: "transfer_invite",
    locale: input.locale,
    vars: {
      serial: result.bottle.serial,
      series: result.bottle.series.name,
      sender: sender ?? anonymousLabel(input.locale),
      link: linkFor(token, input.locale),
    },
  });
  await sendEmail({
    to: user.email,
    key: "transfer_sent",
    locale: user.locale,
    vars: { serial: result.bottle.serial, recipient: recipientEmail },
  });

  if (result.accountClosed) await logout();
  return { accountClosed: result.accountClosed };
}

export function anonymousLabel(locale: string) {
  return { hy: "Անանուն սեփականատեր", ru: "Анонимный владелец" }[locale] ?? "Anonymous owner";
}

/** Flow 5, step 1: what the Accept page shows, and the link state. */
export async function getTransferByToken(token: string) {
  const transfer = await db.transfer.findUnique({
    where: { tokenHash: sha256(token) },
    include: { bottle: { include: { series: true } } },
  });
  if (!transfer) return { state: "invalid" as const };
  if (transfer.status === "ACCEPTED") return { state: "used" as const };
  if (transfer.status !== "PENDING") return { state: "invalid" as const }; // cancelled or reassigned by admin

  return {
    state: "pending" as const,
    serial: transfer.bottle.serial,
    series: transfer.bottle.series.name,
    batch: transfer.bottle.series.batchNumber,
    productionDate: transfer.bottle.series.productionDate,
    sentAt: transfer.createdAt,
    sender: await senderLabel(db, transfer.bottleId, transfer.senderId),
    invitedEmail: transfer.recipientEmail,
    invitedEmailMasked: maskEmail(transfer.recipientEmail),
  };
}

/** Flow 5, steps 3–5. The link works once and only for the invited email. */
export async function acceptTransfer(user: User, token: string, showName: boolean, locale: string) {
  const result = await db.$transaction(async (tx) => {
    const transfer = await tx.transfer.findUnique({
      where: { tokenHash: sha256(token) },
      include: { bottle: true, sender: true },
    });
    if (!transfer) throw new AppError("link_invalid");
    if (transfer.status === "ACCEPTED") throw new AppError("link_used");
    if (transfer.status !== "PENDING") throw new AppError("link_invalid");
    if (transfer.recipientEmail !== user.email) {
      throw new AppError("link_wrong_email", { email: maskEmail(transfer.recipientEmail) });
    }

    const updated = await tx.transfer.updateMany({
      where: { id: transfer.id, status: "PENDING" },
      data: { status: "ACCEPTED", acceptedAt: new Date(), recipientId: user.id },
    });
    if (updated.count !== 1) throw new AppError("link_used");

    await tx.bottle.update({
      where: { id: transfer.bottleId },
      data: { status: "OWNED", currentOwnerId: user.id, claimedAt: new Date() },
    });
    await tx.ownershipPeriod.create({ data: { bottleId: transfer.bottleId, userId: user.id, showName } });
    await ensureCountryPin(tx, user.country);
    return transfer;
  });

  await sendEmail({ to: user.email, key: "transfer_completed", locale, vars: { serial: result.bottle.serial } });
  await sendEmail({
    to: result.sender.email,
    key: "transfer_completed",
    locale: result.sender.locale,
    vars: { serial: result.bottle.serial },
  });
  return { serial: result.bottle.serial };
}

/** Transfers page (design frame 212): transfers the user sent, received, or is invited to accept. */
export async function listMyTransfers(user: User) {
  const transfers = await db.transfer.findMany({
    where: {
      OR: [{ senderId: user.id }, { recipientId: user.id }, { recipientEmail: user.email, status: "PENDING" }],
    },
    include: { bottle: { include: { series: true } }, sender: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const rows = await Promise.all(
    transfers.map(async (t) => {
      const outgoing = t.senderId === user.id;
      return {
        id: t.id,
        serial: t.bottle.serial,
        series: t.bottle.series.name,
        batch: t.bottle.series.batchNumber,
        status: t.status,
        createdAt: t.createdAt,
        outgoing,
        counterpart: outgoing ? t.recipientEmail : await senderLabel(db, t.bottleId, t.senderId),
        awaitingMe: !outgoing && t.status === "PENDING",
      };
    }),
  );
  return {
    stats: {
      awaitingRecipient: rows.filter((r) => r.outgoing && r.status === "PENDING").length,
      awaitingMe: rows.filter((r) => r.awaitingMe).length,
      completed: rows.filter((r) => r.status === "ACCEPTED").length,
    },
    rows,
  };
}
