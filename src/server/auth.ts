import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { sha256, sixDigitCode, safeEqual } from "@/lib/crypto";
import { clearCookie, readCookie, setCookie, type UserToken, type VerifiedToken } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { isCountryCode } from "@/lib/capitals";
import type { OtpPurpose, User } from "@prisma/client";

/** Points to confirm (ToR 8.7): 6 digits, valid 10 minutes, resend after 60 seconds. */
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_PER_HOUR = 6;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const hashOtp = (email: string, code: string) => sha256(`${email}:${code}`);

/** The account an email belongs to right now: any account that is not Closed. */
export function findOpenAccount(email: string) {
  return db.user.findFirst({ where: { email, status: { not: "CLOSED" } } });
}

export async function issueOtp(email: string, purpose: OtpPurpose, locale: string, userId?: string) {
  const last = await db.otpCode.findFirst({ where: { email, purpose }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_MS) {
    throw new AppError("otp_too_soon", {
      retryInSeconds: Math.ceil((OTP_RESEND_MS - (Date.now() - last.createdAt.getTime())) / 1000),
    });
  }
  const lastHour = await db.otpCode.count({
    where: { email, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (lastHour >= OTP_MAX_PER_HOUR) throw new AppError("rate_limited");

  const code = sixDigitCode();
  await db.otpCode.create({
    data: { email, purpose, userId, codeHash: hashOtp(email, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await sendEmail({ to: email, key: "otp", locale, vars: { code } });
}

/** Checks the newest code for this email + purpose. Throws on any failure; marks it used on success. */
export async function consumeOtp(email: string, purpose: OtpPurpose, code: string, userId?: string) {
  const otp = await db.otpCode.findFirst({
    where: { email, purpose, usedAt: null, ...(userId ? { userId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new AppError("otp_invalid");
  if (otp.expiresAt < new Date()) throw new AppError("otp_expired");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new AppError("otp_too_many_attempts");
  if (!safeEqual(otp.codeHash, hashOtp(email, code.trim()))) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError("otp_invalid");
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
}

/** Flow 1, step 1–2: email entered → code sent. One screen for login and registration. */
export async function requestLoginCode(rawEmail: string, locale: string) {
  const email = normalizeEmail(rawEmail);
  await issueOtp(email, "LOGIN", locale);
  return { email };
}

/**
 * Flow 1, step 3–4: code entered.
 *  - Active account → logged in.
 *  - No account, or only Closed ones → registration form (a closed account is never reopened).
 */
export async function verifyLoginCode(rawEmail: string, code: string) {
  const email = normalizeEmail(rawEmail);
  await consumeOtp(email, "LOGIN", code);

  const account = await findOpenAccount(email);
  if (account?.status === "SUSPENDED") throw new AppError("account_suspended");
  if (account) {
    await setCookie("user", { sub: account.id });
    await clearCookie("verified");
    return { status: "logged_in" as const };
  }
  await setCookie("verified", { email });
  return { status: "needs_profile" as const, email };
}

/** Flow 1, step 4 (new user): first name, last name, country. */
export async function register(input: { firstName: string; lastName: string; country: string; locale: string }) {
  const verified = await readCookie<VerifiedToken>("verified");
  if (!verified) throw new AppError("unauthorized");
  if (!isCountryCode(input.country)) throw new AppError("invalid_input", { field: "country" });
  if (await findOpenAccount(verified.email)) throw new AppError("email_in_use");

  const user = await db.user.create({
    data: {
      email: verified.email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      country: input.country,
      locale: input.locale,
    },
  });
  await clearCookie("verified");
  await setCookie("user", { sub: user.id });
  return user;
}

export async function getVerifiedEmail(): Promise<string | null> {
  return (await readCookie<VerifiedToken>("verified"))?.email ?? null;
}

/** The logged-in, Active user — or null. A Closed or Suspended account has no session. */
export async function getCurrentUser(): Promise<User | null> {
  const token = await readCookie<UserToken>("user");
  if (!token) return null;
  const user = await db.user.findUnique({ where: { id: token.sub } });
  return user?.status === "ACTIVE" ? user : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("unauthorized");
  return user;
}

export async function logout() {
  await clearCookie("user");
  await clearCookie("verified");
  await clearCookie("claim");
}
