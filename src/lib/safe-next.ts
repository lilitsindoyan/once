/** Only allow in-app return paths like "/claim" or "/accept/abc" (no open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/my-bottles"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return /^\/(claim|accept\/[\w-]+|my-bottles(\/[\w-]+)*|profile(\/(edit|email))?|transfers|owners)$/.test(next) ? next : fallback;
}
