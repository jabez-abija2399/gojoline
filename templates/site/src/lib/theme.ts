import { contrast, readableOn, tint } from "./color";
import type { Lang, Theme } from "./types";

const fonts: Record<Theme["font"], { heading: string; body: string }> = {
  // System stacks: nothing to download, fast on slow networks. Ge'ez uses the bundled Noto subset.
  modern: {
    heading: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
  classic: {
    heading: 'Georgia, "Times New Roman", "Noto Sans Ethiopic", serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
  friendly: {
    heading: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, "Noto Sans Ethiopic", sans-serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
};

const radii: Record<Theme["radius"], string> = { none: "0", small: "6px", medium: "12px", large: "20px" };

/** CSS variables for <html style="...">, derived from the theme with safe text colours. */
export function themeVariables(theme: Theme, lang: Lang): Record<string, string> {
  const amharicFirst = lang === "am" ? '"Noto Sans Ethiopic", ' : "";
  const muted = contrast(theme.text, theme.background) >= 7 ? mixToward(theme.text, theme.background) : theme.text;
  return {
    "--site-primary": theme.primary,
    "--site-on-primary": readableOn(theme.primary),
    "--site-primary-soft": tint(theme.primary, 0.88),
    "--site-accent": theme.accent,
    "--site-on-accent": readableOn(theme.accent),
    "--site-background": theme.background,
    "--site-surface": "#ffffff",
    "--site-text": theme.text,
    "--site-muted": muted,
    "--site-line": tint(theme.text, 0.85),
    "--site-focus": theme.accent,
    "--site-radius": radii[theme.radius],
    "--site-font-heading": amharicFirst + fonts[theme.font].heading,
    "--site-font-body": amharicFirst + fonts[theme.font].body,
  };
}

/** Softens body text for secondary copy while keeping at least ~4.5:1 on the background. */
function mixToward(text: string, bg: string): string {
  for (const amount of [0.3, 0.2, 0.1]) {
    const candidate = tint(text, amount);
    if (contrast(candidate, bg) >= 4.6) return candidate;
  }
  return text;
}

export function styleString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v.replace(/[;<>]/g, "")}`)
    .join(";");
}
