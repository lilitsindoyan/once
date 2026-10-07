import "server-only";
import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { clearCookie, readCookie, setCookie, type AdminToken } from "@/lib/session";
import type { AdminUser, Prisma } from "@prisma/client";

/** Accepts the current 30-second code and one step either side (clock drift). */
async function totpOk(secret: string, token: string) {
  if (!/^\d{6}$/.test(token)) return false;
  const r = await verify({ secret, token, epochTolerance: 30 });
  return r.valid;
}

let dummyHash: string | undefined;

/** ToR 5.1: email + password, then TOTP when 2FA is enabled. */
export async function adminLogin(email: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Compare against a dummy hash when the admin doesn't exist, so timing doesn't reveal accounts.
  dummyHash ??= await bcrypt.hash("not-a-real-password", 12);
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? dummyHash);
  if (!admin || !ok) throw new AppError("admin_login_failed");
  await setCookie("admin", { sub: admin.id, mfa: !admin.totpEnabled });
  return { needs2fa: admin.totpEnabled };
}

export async function adminVerify2fa(code: string) {
  const token = await readCookie<AdminToken>("admin");
  if (!token) throw new AppError("unauthorized");
  const admin = await db.adminUser.findUnique({ where: { id: token.sub } });
  if (!admin?.totpSecret || !(await totpOk(admin.totpSecret, code.trim()))) throw new AppError("admin_2fa_invalid");
  await setCookie("admin", { sub: admin.id, mfa: true });
}

/** Admin who passed the password step (2FA may still be pending). */
export async function getAdminPartial(): Promise<{ admin: AdminUser; mfa: boolean } | null> {
  const token = await readCookie<AdminToken>("admin");
  if (!token) return null;
  const admin = await db.adminUser.findUnique({ where: { id: token.sub } });
  return admin ? { admin, mfa: token.mfa } : null;
}

export async function getAdmin(): Promise<AdminUser | null> {
  const s = await getAdminPartial();
  return s?.mfa ? s.admin : null;
}

export async function requireAdmin(role?: "SUPER_ADMIN"): Promise<AdminUser> {
  const s = await getAdminPartial();
  if (!s) throw new AppError("unauthorized");
  if (!s.mfa) throw new AppError("admin_2fa_required");
  if (role && s.admin.role !== role) throw new AppError("forbidden");
  return s.admin;
}

export async function adminLogout() {
  await clearCookie("admin");
}

/** 2FA setup: returns a QR code for an authenticator app. Enabled only after a valid code. */
export async function start2faSetup(admin: AdminUser) {
  if (admin.totpEnabled) throw new AppError("forbidden"); // already on; reset is a database task for now
  // Reuse a pending secret so a reload doesn't invalidate a code already scanned.
  const secret = admin.totpSecret ?? generateSecret();
  if (!admin.totpSecret) await db.adminUser.update({ where: { id: admin.id }, data: { totpSecret: secret } });
  const uri = generateURI({ issuer: "ONCE Admin", label: admin.email, secret });
  return { secret, qr: await QRCode.toDataURL(uri) };
}

export async function confirm2faSetup(admin: AdminUser, code: string) {
  const fresh = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!fresh.totpSecret || !(await totpOk(fresh.totpSecret, code.trim()))) throw new AppError("admin_2fa_invalid");
  await db.adminUser.update({ where: { id: admin.id }, data: { totpEnabled: true } });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function audit(
  adminId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: Prisma.InputJsonValue,
) {
  await db.auditLog.create({ data: { adminId, action, entity, entityId, details } });
}
