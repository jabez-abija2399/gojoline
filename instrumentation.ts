import type { Instrumentation } from "next";
import { SAFE_HEADERS, scrubUrl } from "@/lib/observability/scrub";

/**
 * Server errors go to Sentry when SENTRY_DSN is set (no personal data, no tracing).
 * The browser SDK is not loaded: it would cost ~40 KB on every page (see docs/DECISIONS.md).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0,
    // Breadcrumbs: no console lines (they can hold site text), and URLs without secrets or queries
    // (the Telegram API puts the bot token in the path).
    beforeBreadcrumb(crumb) {
      if (crumb.category === "console") return null;
      if (crumb.data?.url) crumb.data.url = scrubUrl(String(crumb.data.url));
      return crumb;
    },
    beforeSend(event) {
      // Never send cookies, request bodies, client IPs or query strings; only a few plain headers.
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.headers) event.request.headers = Object.fromEntries(Object.entries(event.request.headers).filter(([k]) => SAFE_HEADERS.has(k.toLowerCase())));
        if (event.request.url) event.request.url = scrubUrl(event.request.url);
        delete event.request.query_string;
      }
      const nextjs = event.contexts?.nextjs as { request_path?: string } | undefined;
      if (nextjs?.request_path) nextjs.request_path = nextjs.request_path.split("?")[0];
      for (const crumb of event.breadcrumbs ?? []) if (crumb.data?.url) crumb.data.url = scrubUrl(String(crumb.data.url));
      delete event.user;
      return event;
    },
  });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
