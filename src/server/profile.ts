import "server-only";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { consumeOtp, findOpenAccount, issueOtp, normalizeEmail } from "./auth";
import type { User } from "@prisma/client";

/** Flow 6. A name change also shows on Bottle Owners and in named ownership periods (they read the user row). */
export async function updateName(user: User, firstName: string, lastName: string) {
  return db.user.update({
    where: { id: user.id },
    data: { firstName: firstName.trim(), lastName: lastName.trim() },
  });
}

export async function updateLocale(user: User, locale: string) {
  if (!["hy", "en", "ru"].includes(locale)) throw new AppError("invalid_input");
  return db.user.update({ where: { id: user.id }, data: { locale } });
}

/** Email change, step 1: a code goes to the NEW address. An email of another open account is rejected. */
export async function requestEmailChange(user: User, rawEmail: string, locale: string) {
  const email = normalizeEmail(rawEmail);
  if (email === user.email) throw new AppError("invalid_input", { field: "email" });
  const other = await findOpenAccount(email);
  if (other && other.id !== user.id) throw new AppError("email_in_use");
  await issueOtp(email, "EMAIL_CHANGE", locale, user.id);
  return { email };
}

/** Email change, step 2. */
export async function confirmEmailChange(user: User, rawEmail: string, code: string) {
  const email = normalizeEmail(rawEmail);
  await consumeOtp(email, "EMAIL_CHANGE", code, user.id);
  const other = await findOpenAccount(email);
  if (other && other.id !== user.id) throw new AppError("email_in_use");
  return db.user.update({ where: { id: user.id }, data: { email } });
}
