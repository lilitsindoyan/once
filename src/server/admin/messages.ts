import "server-only";
import type { AdminUser } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "./auth";

const PAGE = 30;

/** Landing Contact form messages, newest first. */
export async function listMessages(page = 1, unreadOnly = false) {
  const where = unreadOnly ? { readAt: null } : {};
  const [total, rows, unread] = await Promise.all([
    db.contactMessage.count({ where }),
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.contactMessage.count({ where: { readAt: null } }),
  ]);
  return { rows, unread, page, pages: Math.max(1, Math.ceil(total / PAGE)) };
}

export const unreadMessageCount = () => db.contactMessage.count({ where: { readAt: null } });

export async function setMessageRead(admin: AdminUser, id: string, read: boolean) {
  await db.contactMessage.update({ where: { id }, data: { readAt: read ? new Date() : null } });
  await audit(admin.id, read ? "message.read" : "message.unread", "ContactMessage", id);
}
