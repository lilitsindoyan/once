"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import { AppError } from "@/lib/errors";
import {
  adminLogin,
  adminLogout,
  adminVerify2fa,
  confirm2faSetup,
  requireAdmin,
} from "@/server/admin/auth";
import { createSeries, updateSeriesDefaults, updateSeriesTemplate } from "@/server/admin/series";
import { cancelTransfer, reassignBottle, resendInvite, setDeactivated, updatePassportValues } from "@/server/admin/bottles";
import { setCustomerStatus, updateCustomer } from "@/server/admin/customers";
import { saveEmailTemplate, saveLanguageString, savePin, setOwnerEntryHidden } from "@/server/admin/content";
import type { PassportField } from "@/server/bottles";
import type { EmailKey } from "@/lib/email-defaults";

/** Runs an admin mutation and returns to `path` with ?ok= or ?err=. */
async function act(path: string, okMessage: string, fn: () => Promise<unknown>) {
  let err: string | null = null;
  try {
    await fn();
  } catch (e) {
    if (e instanceof AppError) {
      if (e.code === "unauthorized" || e.code === "admin_2fa_required") redirect("/admin/login");
      err = e.code;
    } else if (e instanceof ZodError) err = "invalid_input";
    else {
      console.error(e);
      err = "generic";
    }
  }
  revalidatePath(path.split("?")[0]);
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${err ? `err=${err}` : `ok=${encodeURIComponent(okMessage)}`}`);
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/* ---------- Auth ---------- */

export async function loginAction(fd: FormData) {
  let needs2fa = false;
  try {
    ({ needs2fa } = await adminLogin(str(fd, "email"), String(fd.get("password") ?? "")));
  } catch (e) {
    redirect(`/admin/login?err=${e instanceof AppError ? e.code : "generic"}`);
  }
  redirect(needs2fa ? "/admin/login?step=2fa" : "/admin");
}

export async function verify2faAction(fd: FormData) {
  try {
    await adminVerify2fa(str(fd, "code"));
  } catch (e) {
    redirect(`/admin/login?step=2fa&err=${e instanceof AppError ? e.code : "generic"}`);
  }
  redirect("/admin");
}

export async function logoutAction() {
  await adminLogout();
  redirect("/admin/login");
}

export async function confirm2faAction(fd: FormData) {
  await act("/admin/account", "Two-factor authentication is on.", async () =>
    confirm2faSetup(await requireAdmin(), str(fd, "code")),
  );
}

/* ---------- Series ---------- */

const zField = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  label: z.object({ en: z.string().min(1), hy: z.string().default(""), ru: z.string().default("") }),
  type: z.enum(["text", "date", "longtext"]).default("text"),
});

/** Template is edited as lines: key | English | Armenian | Russian | type */
function parseTemplate(text: string): PassportField[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, en, hy, ru, type] = line.split("|").map((p) => p.trim());
      return zField.parse({ key, label: { en, hy: hy ?? "", ru: ru ?? "" }, type: type || "text" });
    });
}

export async function createSeriesAction(fd: FormData) {
  let id = "";
  await act("/admin/series", "Series created.", async () => {
    const admin = await requireAdmin("SUPER_ADMIN");
    const s = await createSeries(admin, {
      name: z.string().min(1).max(120).parse(str(fd, "name")),
      batchNumber: z.string().min(1).max(60).parse(str(fd, "batchNumber")),
      quantity: z.coerce.number().int().parse(str(fd, "quantity")),
      productionDate: str(fd, "productionDate") || undefined,
      template: parseTemplate(str(fd, "template")),
    });
    id = s.id;
  });
  void id;
}

export async function updateTemplateAction(fd: FormData) {
  const id = str(fd, "seriesId");
  await act(`/admin/series/${id}`, "Passport template saved.", async () =>
    updateSeriesTemplate(await requireAdmin("SUPER_ADMIN"), id, parseTemplate(str(fd, "template"))),
  );
}

export async function seriesDefaultsAction(fd: FormData) {
  const id = str(fd, "seriesId");
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (k.startsWith("f_")) values[k.slice(2)] = String(v);
  await act(`/admin/series/${id}`, "Passport values saved for the whole series.", async () =>
    updateSeriesDefaults(await requireAdmin(), id, values),
  );
}

/* ---------- Bottles ---------- */

export async function bottleAction(fd: FormData) {
  const id = str(fd, "bottleId");
  const op = str(fd, "op");
  const messages: Record<string, string> = {
    cancel: "Transfer cancelled. The bottle is back with the sender.",
    resend: "Invitation re-sent with a new link.",
    reassign: "Bottle reassigned.",
    deactivate: "Bottle deactivated.",
    reactivate: "Bottle reactivated.",
  };
  await act(`/admin/bottles/${id}`, messages[op] ?? "Done.", async () => {
    const admin = await requireAdmin();
    if (op === "cancel") return cancelTransfer(admin, id);
    if (op === "resend") return resendInvite(admin, id);
    if (op === "reassign") return reassignBottle(admin, id, z.string().email().parse(str(fd, "email")));
    if (op === "deactivate") return setDeactivated(admin, id, true);
    if (op === "reactivate") return setDeactivated(admin, id, false);
    throw new AppError("invalid_input");
  });
}

export async function passportValuesAction(fd: FormData) {
  const id = str(fd, "bottleId");
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (k.startsWith("f_")) values[k.slice(2)] = String(v);
  await act(`/admin/bottles/${id}`, "Passport saved.", async () => updatePassportValues(await requireAdmin(), id, values));
}

/* ---------- Customers ---------- */

export async function updateCustomerAction(fd: FormData) {
  const id = str(fd, "userId");
  await act(`/admin/customers/${id}`, "Customer saved.", async () =>
    updateCustomer(await requireAdmin(), id, {
      firstName: z.string().min(1).max(80).parse(str(fd, "firstName")),
      lastName: z.string().min(1).max(80).parse(str(fd, "lastName")),
      email: z.string().email().parse(str(fd, "email")),
      country: z.string().length(2).parse(str(fd, "country")),
    }),
  );
}

export async function customerStatusAction(fd: FormData) {
  const id = str(fd, "userId");
  const status = z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]).parse(str(fd, "status"));
  await act(`/admin/customers/${id}`, `Account set to ${status.toLowerCase()}.`, async () =>
    setCustomerStatus(await requireAdmin(), id, status),
  );
}

/* ---------- Content ---------- */

export async function ownerHiddenAction(fd: FormData) {
  await act("/admin/owners", "Saved.", async () =>
    setOwnerEntryHidden(await requireAdmin(), str(fd, "periodId"), str(fd, "hidden") === "1"),
  );
}

export async function pinAction(fd: FormData) {
  await act("/admin/map", "Pin saved.", async () =>
    savePin(await requireAdmin(), {
      countryCode: z.string().length(2).parse(str(fd, "countryCode").toUpperCase()),
      lat: str(fd, "lat") ? z.coerce.number().parse(str(fd, "lat")) : undefined,
      lng: str(fd, "lng") ? z.coerce.number().parse(str(fd, "lng")) : undefined,
      visible: str(fd, "visible") === "1",
    }),
  );
}

export async function emailTemplateAction(fd: FormData) {
  const key = str(fd, "key") as EmailKey;
  const locale = str(fd, "locale");
  await act(`/admin/emails?key=${key}`, "Email template saved.", async () =>
    saveEmailTemplate(
      await requireAdmin(),
      key,
      locale,
      z.string().min(1).max(200).parse(str(fd, "subject")),
      z.string().min(1).max(5000).parse(String(fd.get("body") ?? "")),
    ),
  );
}

export async function languageStringAction(fd: FormData) {
  const key = str(fd, "key");
  const q = str(fd, "q");
  await act(`/admin/strings${q ? `?q=${encodeURIComponent(q)}` : ""}`, `Saved "${key}".`, async () => {
    const admin = await requireAdmin();
    for (const locale of ["hy", "en", "ru"]) {
      await saveLanguageString(admin, key, locale, String(fd.get(locale) ?? ""));
    }
  });
}
