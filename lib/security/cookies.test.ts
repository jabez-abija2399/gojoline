import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { authCookiePrefix } from "@/lib/auth/config";
import { COOKIE_BASES, cookieAttrs, cookieName, readCookie, type CookieKey } from "./cookies";

const root = join(__dirname, "..", "..");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "node_modules" || name.startsWith(".") ? [] : sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

describe("app cookies", () => {
  it("every cookie the app sets is __Host- in production (Secure, Path=/, no Domain)", () => {
    for (const key of Object.keys(COOKIE_BASES) as CookieKey[]) {
      expect(cookieName(key, true)).toBe(`__Host-${COOKIE_BASES[key]}`);
      expect(cookieName(key, false)).toBe(COOKIE_BASES[key]);
    }
    expect(cookieAttrs(true)).toEqual({ path: "/", secure: true });
    expect(authCookiePrefix(true)).toMatch(/^__Host-/);
    expect(Object.values(COOKIE_BASES).sort()).toEqual(["gojo_admin_theme", "gojo_lang", "gojo_src", "gojo_theme", "gojo_tiktok_state"]);
  });

  it("no code sets a cookie by a hand-written name or with a Domain", () => {
    const offenders: string[] = [];
    for (const file of [...sources(join(root, "app")), ...sources(join(root, "lib")), ...sources(join(root, "components")), join(root, "proxy.ts")]) {
      const text = readFileSync(file, "utf8");
      const rel = relative(root, file);
      // A cookie set (server: cookies().set / response.cookies.set / jar.set; browser: document.cookie).
      for (const m of text.matchAll(/(?:cookies(?:\(\)\))?|jar)\.set\(\s*([^,]+),/g)) if (!m[1]!.trim().startsWith("cookieName(")) offenders.push(`${rel}: ${m[0]}`);
      for (const m of text.matchAll(/document\.cookie\s*=\s*`([^`]*)`/g)) if (!m[1]!.startsWith("${cookieName(")) offenders.push(`${rel}: ${m[0]}`);
      if (/domain\s*:\s*["'`]\.?[a-z]/i.test(text) && /cookie/i.test(text)) offenders.push(`${rel}: cookie with a Domain`);
    }
    expect(offenders).toEqual([]);
  });

  it("reads the old plain name once, so nobody loses their language or theme", () => {
    const jar = new Map([["gojo_lang", "am"]]);
    expect(readCookie((n) => jar.get(n), "lang")).toBe("am");
    jar.set(cookieName("lang"), "en");
    expect(readCookie((n) => jar.get(n), "lang")).toBe("en");
  });
});
