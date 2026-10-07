import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** Crockford base32 without I, L, O, U — easy to read off a label. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function randomChars(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/**
 * Non-sequential serial number, e.g. "ONC-7K3P-9QXM".
 * 8 random base32 chars = 2^40 combinations, so serials can't be guessed or enumerated.
 * Format to be confirmed by the client (see dev handoff, Open questions).
 */
export function generateSerial(): string {
  return `ONC-${randomChars(4)}-${randomChars(4)}`;
}

/** Hidden code printed under the cap / scratch label, e.g. "4QZ7-M2KD". */
export function generateHiddenCode(): string {
  return `${randomChars(4)}-${randomChars(4)}`;
}

/** Upper-case, drop spaces and dashes, map look-alike letters (O→0, I/L→1). */
function clean(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

/** "onc 7k3p 9qxm", "7K3P9QXM", "ONC-7K3P-9QXM" → "ONC-7K3P-9QXM". Returns null if malformed. */
export function canonicalSerial(input: string): string | null {
  const s = clean(input).replace(/^0NC/, "");
  return /^[0-9A-Z]{8}$/.test(s) ? `ONC-${s.slice(0, 4)}-${s.slice(4)}` : null;
}

/** "4qz7 m2kd" → "4QZ7-M2KD". Returns null if malformed. */
export function canonicalHiddenCode(input: string): string | null {
  const s = clean(input);
  return /^[0-9A-Z]{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4)}` : null;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function key(): Buffer {
  return createHash("sha256").update(env.HIDDEN_CODE_KEY).digest();
}

/** AES-256-GCM. Output: base64url(iv).base64url(tag).base64url(ciphertext) */
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** a•••@gmail.com — used when the invited email must be hinted, not shown. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}
