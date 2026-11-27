import { cookieName, hostCookies } from "@/lib/security/cookies";
import type { Theme } from "./theme-shared";

/** Applies the look to the page now and remembers it for a year (the server reads it next time).
 *  The admin area keeps its own choice. */
export function applyTheme(next: Theme) {
  document.querySelectorAll<HTMLElement>("[data-gojo-theme]").forEach((el) => {
    if (!el.closest(".admin-root")) el.dataset.gojoTheme = next;
  });
  // __Host- in production (lib/security/cookies.ts): Secure, Path=/, no Domain.
  const secure = hostCookies() ? "; secure" : "";
  document.cookie = `${cookieName("theme")}=${next}; path=/; max-age=31536000; samesite=lax${secure}`;
}
