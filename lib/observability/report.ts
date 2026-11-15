/**
 * Logs a handled server error and sends it to Sentry when configured. Use for failures we
 * recover from (the user sees a friendly message) but still need to know about.
 */
export function reportError(where: string, error: unknown, extra: Record<string, string | number | null> = {}): void {
  const message = error instanceof Error ? error.message : "unknown";
  console.error(where, message);
  if (!process.env.SENTRY_DSN || process.env.NEXT_RUNTIME === "edge") return;
  void import("@sentry/nextjs")
    .then((Sentry) => Sentry.captureException(error instanceof Error ? error : new Error(message), { tags: { where }, extra }))
    .catch(() => undefined);
}
