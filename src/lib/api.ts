import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { z, ZodError } from "zod";
import { AppError } from "./errors";
import { sha256 } from "./crypto";

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler: parses JSON with a zod schema, maps AppError → { error } JSON. */
export function route<S extends z.ZodTypeAny, P = Record<string, string>>(
  schema: S | null,
  fn: (body: z.infer<S>, req: NextRequest, params: P) => Promise<unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      let body: unknown = undefined;
      if (schema) {
        const raw = req.method === "GET" ? Object.fromEntries(req.nextUrl.searchParams) : await req.json().catch(() => ({}));
        body = schema.parse(raw);
      }
      const result = await fn(body as z.infer<S>, req, await ctx.params);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof AppError) {
        return NextResponse.json({ error: e.code, ...e.details }, { status: e.status });
      }
      if (e instanceof ZodError) {
        return NextResponse.json(
          { error: "invalid_input", fields: e.issues.map((i) => i.path.join(".")) },
          { status: 400 },
        );
      }
      console.error(e);
      return NextResponse.json({ error: "generic" }, { status: 500 });
    }
  };
}

/** Identifies a client for rate limiting without storing the raw IP. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return sha256(`${ip}|${h.get("user-agent") ?? ""}`).slice(0, 32);
}

export const zLocale = z.enum(["hy", "en", "ru"]).default("en");
export const zEmail = z.string().trim().email().max(254);
export const zName = z.string().trim().min(1).max(80);
