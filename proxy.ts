import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage } from "@/lib/i18n/config";
import { createNonce, cspFromEnv } from "@/lib/security/csp";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_MAX_AGE, attributionFromRequest, decodeAttribution, encodeAttribution, keepFirstTouch } from "@/lib/growth/attribution";

/**
 * First touch: where a visitor first came from (?ref=, utm tags or the referring site), in a
 * first-party cookie read once at sign-up. Never replaced, except by an owner's invite link
 * (so "you both get" holds even if the visitor first came another way).
 */
function rememberFirstTouch(request: NextRequest, response: NextResponse) {
  const a = attributionFromRequest(request.nextUrl.searchParams, request.headers.get("referer"), request.nextUrl.hostname);
  // request.cookies holds decoded values; decodeAttribution expects the raw (encoded) form.
  const raw = request.cookies.get(ATTRIBUTION_COOKIE)?.value;
  const kept = raw ? decodeAttribution(encodeURIComponent(raw)) : null;
  if (a && keepFirstTouch(kept, a) === a) {
    response.cookies.set(ATTRIBUTION_COOKIE, encodeAttribution(a), {
      path: "/",
      maxAge: ATTRIBUTION_MAX_AGE,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (!isLocale(firstSegment)) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookieLocale)
      ? cookieLocale
      : localeFromAcceptLanguage(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return rememberFirstTouch(request, NextResponse.redirect(url));
  }

  const nonce = createNonce();
  const csp = cspFromEnv(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  // Remember the language the visitor last used.
  if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
    response.cookies.set(LOCALE_COOKIE, firstSegment, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return rememberFirstTouch(request, response);
}

export const config = {
  matcher: [
    {
      // Pages only: skip API routes, Next internals and files with an extension.
      // Short links (/r/<code>) are route handlers that redirect by themselves.
      source: "/((?!api|demo|r/|_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
