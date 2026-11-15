import type { Instrumentation } from "next";

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
    beforeSend(event) {
      // Never send cookies, auth headers or request bodies (they can hold sign-in codes or answers).
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.headers) event.request.headers = Object.fromEntries(Object.entries(event.request.headers).filter(([k]) => !/cookie|authorization|token|secret/i.test(k)));
        if (event.request.query_string) event.request.query_string = "[removed]";
      }
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
