"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

export class ApiError extends Error {
  constructor(
    public code: string,
    public details: Record<string, unknown>,
  ) {
    super(code);
  }
}

/** Calls our JSON API from the browser. Throws ApiError with the server's error code. */
export async function api<T = Record<string, unknown>>(path: string, body?: unknown, method?: string): Promise<T> {
  const res = await fetch(path, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: "generic" }));
  if (!res.ok) {
    const { error, ...details } = data as { error?: string };
    throw new ApiError(error ?? "generic", details);
  }
  return data as T;
}

/** Turns any thrown error into a translated message. */
export function useErrorMessage() {
  const t = useTranslations("errors");
  return useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        const values = {
          seconds: String(e.details.retryInSeconds ?? 60),
          email: String(e.details.email ?? ""),
        };
        return t.has(e.code) ? t(e.code, values) : t("generic");
      }
      return t("generic");
    },
    [t],
  );
}
