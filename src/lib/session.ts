import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * Signed cookies (JWT, HS256, httpOnly):
 *  - once_session   user is logged in            { sub: userId }                30 days
 *  - once_verified  email confirmed by OTP, but  { email }                      30 min
 *                   no active account yet → registration form
 *  - once_claim     claim check passed           { bottleId }                   30 min
 *  - once_admin     admin logged in              { sub: adminId, mfa: boolean } 12 h
 */
const COOKIES = {
  user: { name: "once_session", maxAge: 60 * 60 * 24 * 30 },
  verified: { name: "once_verified", maxAge: 60 * 30 },
  claim: { name: "once_claim", maxAge: 60 * 30 },
  admin: { name: "once_admin", maxAge: 60 * 60 * 12 },
} as const;

type Kind = keyof typeof COOKIES;

function secret() {
  return new TextEncoder().encode(env.SESSION_SECRET);
}

async function sign(kind: Kind, payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload, typ: kind })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIES[kind].maxAge}s`)
    .sign(secret());
}

async function verify<T extends JWTPayload>(kind: Kind, token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.typ === kind ? (payload as T) : null;
  } catch {
    return null;
  }
}

export async function setCookie(kind: Kind, payload: JWTPayload) {
  const jar = await cookies();
  jar.set(COOKIES[kind].name, await sign(kind, payload), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIES[kind].maxAge,
  });
}

export async function readCookie<T extends JWTPayload>(kind: Kind): Promise<T | null> {
  const jar = await cookies();
  return verify<T>(kind, jar.get(COOKIES[kind].name)?.value);
}

export async function clearCookie(kind: Kind) {
  const jar = await cookies();
  jar.delete(COOKIES[kind].name);
}

export type UserToken = JWTPayload & { sub: string };
export type VerifiedToken = JWTPayload & { email: string };
export type ClaimToken = JWTPayload & { bottleId: string };
export type AdminToken = JWTPayload & { sub: string; mfa: boolean };
