import { THEME_COOKIE, type Theme } from "./theme-shared";

/** Applies the look to the page now and remembers it for a year (the server reads it next time).
 *  The admin area keeps its own choice. */
export function applyTheme(next: Theme) {
  document.querySelectorAll<HTMLElement>("[data-gojo-theme]").forEach((el) => {
    if (!el.closest(".admin-root")) el.dataset.gojoTheme = next;
  });
  const secure = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax${secure}`;
}
