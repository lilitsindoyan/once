/**
 * End-to-end check of every flow in the User Flow document, against a running app.
 *
 *   EMAIL_PROVIDER=console npm start > server.log 2>&1 &
 *   node scripts/e2e.mjs http://localhost:3000 server.log
 *
 * Reads one-time codes from the server log (console email provider) and bottle codes
 * straight from the database, so it needs the same .env as the app.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { createDecipheriv, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.argv[2] ?? "http://localhost:3000";
const LOG = process.argv[3] ?? "server.log";
const db = new PrismaClient();
let passed = 0;

function check(cond, label) {
  if (!cond) throw new Error(`FAIL: ${label}`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function decrypt(payload) {
  const key = createHash("sha256").update(process.env.HIDDEN_CODE_KEY).digest();
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

/** A browser: keeps cookies between calls. */
class Client {
  jar = new Map();
  constructor(ip) {
    this.ip = ip;
  }
  async call(path, body, method) {
    const res = await fetch(BASE + path, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": this.ip,
        Cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const [k, v] = pair.split("=");
      if (v === "" || /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c)) this.jar.delete(k);
      else this.jar.set(k, v);
    }
    const data = res.headers.get("content-type")?.includes("json") ? await res.json() : await res.text();
    return { status: res.status, data, location: res.headers.get("location") ?? "" };
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function lastCode(email) {
  await sleep(300);
  const log = readFileSync(LOG, "utf8");
  const re = new RegExp(`\\[email\\] to=${email.replace(/[.+]/g, "\\$&")} key=otp[\\s\\S]*?code is (\\d{6})`, "g");
  const all = [...log.matchAll(re)];
  if (!all.length) throw new Error(`no OTP in log for ${email}`);
  return all.at(-1)[1];
}

async function lastInviteToken(email) {
  await sleep(300);
  const log = readFileSync(LOG, "utf8");
  const re = new RegExp(`\\[email\\] to=${email.replace(/[.+]/g, "\\$&")} key=transfer_invite[\\s\\S]*?/accept/([\\w-]+)`, "g");
  return [...log.matchAll(re)].at(-1)[1];
}

async function login(client, email, profile) {
  check((await client.call("/api/auth/otp/request", { email, locale: "en" })).status === 200, `code sent to ${email}`);
  const code = await lastCode(email);
  const v = await client.call("/api/auth/otp/verify", { email, code });
  if (profile) {
    check(v.data.status === "needs_profile", "new email → registration form");
    const r = await client.call("/api/auth/register", { ...profile, locale: "en" });
    check(r.status === 200, "account created");
  } else check(v.data.status === "logged_in", "existing account → logged in");
}

async function main() {
  const stamp = Date.now();
  const anna = `anna.${stamp}@example.com`;
  const ben = `ben.${stamp}@example.com`;
  const bottles = await db.bottle.findMany({ where: { status: "UNCLAIMED" }, take: 3 });
  if (bottles.length < 3) throw new Error("Need 3 unclaimed bottles: run npm run db:seed:demo");
  const [b1, b2] = bottles;
  const code1 = decrypt(b1.hiddenCodeEnc);

  console.log("\nFlow 2 — claim checks (ToR 4.1)");
  const a = new Client("10.0.0.1");
  let r = await a.call("/api/claim/check", { serial: b1.serial, code: "AAAA-AAAA" });
  check(r.data.error === "claim_incorrect", "wrong code → 'Serial number or code is incorrect'");
  r = await a.call("/api/claim/check", { serial: "ONC-0000-0000", code: code1 });
  check(r.data.error === "claim_incorrect", "unknown serial → the same message");
  r = await a.call("/api/claim/check", { serial: b1.serial.toLowerCase().replace(/-/g, " "), code: code1.replace("-", "") });
  check(r.status === 200 && r.data.serial === b1.serial, "valid pair accepted, typed loosely (lower case, no dashes)");

  console.log("\nFlow 1 — register via email OTP, bottle remembered");
  r = await a.call("/api/auth/otp/verify", { email: anna, code: "000000" });
  check(r.data.error === "otp_invalid", "code without a request → rejected");
  await login(a, anna, { firstName: "Anna", lastName: "Petrosyan", country: "AM" });
  r = await a.call("/api/auth/otp/request", { email: anna, locale: "en" });
  check(r.data.error === "otp_too_soon", "resend blocked for 60 s");

  console.log("\nFlow 2 — claim");
  r = await a.call("/api/claim", { showName: true, locale: "en" });
  check(r.status === 200 && r.data.serial === b1.serial, "bottle claimed after registration");
  check((await db.mapPin.findUnique({ where: { countryCode: "AM" } })) !== null, "map pin added on Yerevan");
  r = await new Client("10.0.0.2").call("/api/claim/check", { serial: b1.serial, code: code1 });
  check(r.data.error === "claim_already_registered", "claimed bottle → 'already registered'");

  // second bottle for Anna
  await a.call("/api/claim/check", { serial: b2.serial, code: decrypt(b2.hiddenCodeEnc) });
  r = await a.call("/api/claim", { showName: false, locale: "en" });
  check(r.status === 200, "second bottle claimed anonymously");

  console.log("\nFlow 3 — My Bottles and passport");
  r = await a.call("/api/me/bottles");
  check(r.data.bottles.length === 2, "My Bottles lists 2 bottles");
  r = await a.call(`/api/me/bottles/${b1.serial}`);
  check(r.data.serial === b1.serial && r.data.history.length === 1, "passport with ownership history");
  check(!JSON.stringify(r.data).includes(code1), "hidden code never in the passport");
  check(r.data.fields.some((f) => f.value), "series passport values shown");

  console.log("\nBottle Owners page");
  r = await a.call(`/api/owners?q=Petrosyan`);
  check(r.data.rows.some((x) => x.serial === b1.serial), "named owner listed");
  check(!r.data.rows.some((x) => x.serial === b2.serial), "anonymous owner not listed");

  console.log("\nFlow 4 — transfer (sender)");
  r = await a.call(`/api/me/bottles/${b1.serial}/transfer`, { showName: true, email: ben, emailConfirm: "x" + ben, locale: "en" });
  check(r.data.error === "invalid_input" || r.data.error === "transfer_email_mismatch", "emails must match");
  r = await a.call(`/api/me/bottles/${b1.serial}/transfer`, { showName: true, email: anna, emailConfirm: anna, locale: "en" });
  check(r.data.error === "transfer_own_email", "own email rejected");
  r = await a.call(`/api/me/bottles/${b1.serial}/transfer`, { showName: false, email: ben, emailConfirm: ben.toUpperCase(), locale: "en" });
  check(r.status === 200 && r.data.accountClosed === false, "transfer sent, account stays open (1 bottle left)");
  r = await a.call(`/api/me/bottles/${b1.serial}`);
  check(r.status === 404, "sender lost access immediately");
  check((await db.bottle.findUnique({ where: { id: b1.id } })).status === "IN_TRANSFER", "bottle is In Transfer");
  r = await a.call(`/api/owners?q=${b1.serial}`);
  check(r.data.rows.length === 0, "sender removed from Bottle Owners for this bottle");

  console.log("\nFlow 5 — accept (recipient)");
  const token = await lastInviteToken(ben);
  const stranger = new Client("10.0.0.3");
  r = await stranger.call(`/api/transfer/${token}`);
  check(r.data.state === "pending" && r.data.sender === null && !JSON.stringify(r.data).includes(ben), "accept page: anonymous sender, email masked");
  await login(stranger, `eve.${stamp}@example.com`, { firstName: "Eve", lastName: "Other", country: "FR" });
  r = await stranger.call(`/api/transfer/${token}/accept`, { showName: true, locale: "en" });
  check(r.data.error === "link_wrong_email" && r.data.email.startsWith("b•••@"), "other account can't accept (masked hint)");
  const b = new Client("10.0.0.4");
  await login(b, ben, { firstName: "Ben", lastName: "Smith", country: "GB" });
  r = await b.call("/en/my-bottles");
  check(r.status === 307 && /\/en\/transfers\/\w+$/.test(r.location), "no bottles + waiting invitation → My Bottles opens the accept flow");
  r = await b.call(`/api/transfer/${token}/accept`, { showName: true, locale: "en" });
  check(r.status === 200 && r.data.serial === b1.serial, "recipient accepted");
  r = await b.call(`/api/transfer/${token}/accept`, { showName: true, locale: "en" });
  check(r.data.error === "link_used", "link works once");
  r = await b.call(`/api/me/bottles/${b1.serial}`);
  check(r.data.history.length === 2 && r.data.history[0].name === null && r.data.history[1].name === "Ben Smith", "history: Anonymous owner → Ben Smith");
  check((await db.mapPin.findUnique({ where: { countryCode: "GB" } })) !== null, "map pin added on London");

  console.log("\nFlow 7 — last bottle out closes the account");
  r = await a.call(`/api/me/bottles/${b2.serial}/transfer`, { showName: true, email: ben, emailConfirm: ben, locale: "en" });
  check(r.data.accountClosed === true, "account closed after last transfer");
  r = await a.call("/api/me/bottles");
  check(r.status === 401, "closed account is logged out");
  const a2 = new Client("10.0.0.5");
  // Skip the 60-second resend wait instead of sleeping.
  await db.otpCode.updateMany({ where: { email: anna }, data: { createdAt: new Date(Date.now() - 120_000) } });
  await login(a2, anna, { firstName: "Anna", lastName: "Petrosyan", country: "AM" });
  const annas = await db.user.findMany({ where: { email: anna } });
  check(annas.length === 2 && annas.some((u) => u.status === "CLOSED"), "same email → new account; admin keeps both");

  console.log("\nAccept from the Transfers page (no email link)");
  const pendingForBen = await db.transfer.findFirst({ where: { recipientEmail: ben, status: "PENDING" } });
  r = await b.call("/api/me/bottles");
  const before = r.data.bottles.length;
  r = await stranger.call(`/api/me/transfers/${pendingForBen.id}/accept`, { showName: true, locale: "en" });
  check(r.data.error === "link_wrong_email", "another account can't accept by id");
  r = await stranger.call(`/en/transfers/${pendingForBen.id}`);
  check(r.status === 404, "another account can't open the accept page");
  r = await new Client("10.0.0.12").call(`/api/me/transfers/${pendingForBen.id}/accept`, { showName: true, locale: "en" });
  check(r.status === 401, "accept by id needs login");
  r = await b.call("/en/my-bottles");
  check(r.status === 200 && String(r.data).includes("Review &amp; accept"), "owner with bottles sees the invitation banner");
  r = await b.call(`/en/transfers/${pendingForBen.id}`);
  check(r.status === 200, "invited user opens the accept page");
  r = await b.call(`/api/me/transfers/${pendingForBen.id}/accept`, { showName: false, locale: "en" });
  check(r.status === 200, "invited user accepts from the Transfers page");
  r = await b.call(`/api/me/transfers/${pendingForBen.id}/accept`, { showName: false, locale: "en" });
  check(r.data.error === "link_used", "can't accept twice");
  r = await b.call("/api/me/bottles");
  check(r.data.bottles.length === before + 1, "bottle is now in My Bottles");

  console.log("\nFlow 6 — profile");
  r = await b.call("/api/me/profile", { firstName: "Benjamin", lastName: "Smith" }, "PATCH");
  check(r.status === 200, "name updated");
  r = await b.call(`/api/owners?q=Benjamin`);
  check(r.data.rows.length >= 1, "new name shows on Bottle Owners");
  r = await b.call("/api/me/email", { email: anna, locale: "en" });
  check(r.data.error === "email_in_use", "email of another open account rejected");
  const newBen = `ben.new.${stamp}@example.com`;
  r = await b.call("/api/me/email", { email: newBen, locale: "en" });
  check(r.status === 200, "code sent to the new email");
  r = await b.call("/api/me/email/confirm", { email: newBen, code: await lastCode(newBen) });
  check(r.status === 200, "email changed after code");

  console.log("\nRate limit — 5 wrong claims → blocked");
  const bad = new Client("10.0.0.9");
  for (let i = 0; i < 5; i++) await bad.call("/api/claim/check", { serial: "ONC-1111-1111", code: "2222-2222" });
  r = await bad.call("/api/claim/check", { serial: b1.serial, code: code1 });
  check(r.data.error === "claim_blocked", "6th attempt blocked for 15 minutes");

  console.log("\nAccess control");
  r = await new Client("10.0.0.10").call(`/api/me/bottles/${b1.serial}`);
  check(r.status === 401, "passport needs login");
  r = await a2.call(`/api/me/bottles/${b1.serial}`);
  check(r.status === 404, "another user's passport is not reachable");
  r = await new Client("10.0.0.11").call("/api/admin/customers/export");
  check(r.status === 401, "admin export needs admin login");

  console.log(`\nAll ${passed} checks passed.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
