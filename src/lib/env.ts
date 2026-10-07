import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  /** Signs user and admin session cookies. 32+ random chars. */
  SESSION_SECRET: z.string().min(32),
  /** Encrypts hidden codes at rest. 32+ random chars. Never rotate without re-encrypting. */
  HIDDEN_CODE_KEY: z.string().min(32),
  /** Public base URL, used in email links and the general QR code. */
  APP_URL: z.string().url().default("http://localhost:3000"),
  /** "console" logs emails (dev); "postmark" sends them. */
  EMAIL_PROVIDER: z.enum(["console", "postmark"]).default("console"),
  EMAIL_FROM: z.string().default("ONCE <hello@example.com>"),
  POSTMARK_TOKEN: z.string().optional(),
  NODE_ENV: z.string().default("development"),
});

type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Validated lazily so `next build` works without a full .env. */
export const env = new Proxy({} as Env, {
  get(_t, prop: string) {
    cached ??= schema.parse(process.env);
    return cached[prop as keyof Env];
  },
});
