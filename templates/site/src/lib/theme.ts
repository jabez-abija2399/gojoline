import { contrast, readableOn, tint } from "./color";
import type { Lang, Theme } from "./types";

const fonts: Record<Theme["font"], { heading: string; body: string }> = {
  // Headings use one small bundled font (public/fonts); body text stays on system fonts, so
  // there is little to download on slow networks. Ge'ez uses the bundled Noto subset.
  modern: {
    heading: '"Outfit", system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
  classic: {
    heading: '"Fraunces", Georgia, "Times New Roman", "Noto Sans Ethiopic", serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
  friendly: {
    heading: '"Nunito", ui-rounded, "SF Pro Rounded", system-ui, "Noto Sans Ethiopic", sans-serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
  elegant: {
    heading: '"Cormorant Garamond", "Iowan Old Style", Georgia, "Times New Roman", "Noto Sans Ethiopic", serif',
    body: 'system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
  },
  grotesk: {
    heading: '"Bricolage Grotesque", system-ui, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif',
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
    "--site-focus": focusColor(theme),
    "--site-radius": radii[theme.radius],
    // Amharic pages skip the Latin display font: a heading's spaces alone would make the
    // browser download it, and its arrival would shift the page.
    "--site-font-heading": lang === "am" ? amharicFirst + fonts[theme.font].body : fonts[theme.font].heading,
    "--site-font-body": amharicFirst + fonts[theme.font].body,
  };
}

/** The focus ring must stand out on the page (3:1): accent if it can, else primary, else text. */
export function focusColor(theme: Theme): string {
  for (const c of [theme.accent, theme.primary]) if (contrast(c, theme.background) >= 3) return c;
  return theme.text;
}

/** Softens body text for secondary copy while keeping at least ~4.5:1 on the background. */
function mixToward(text: string, bg: string): string {
  for (const amount of [0.3, 0.2, 0.1]) {
    const candidate = tint(text, amount);
    if (contrast(candidate, bg) >= 4.6) return candidate;
  }
  return text;
}

/** The bundled heading font file for a theme (for a preload on Latin-script pages). */
export const headingFontFile: Record<Theme["font"], string> = { modern: "outfit-latin.woff2", classic: "fraunces-latin.woff2", friendly: "nunito-latin.woff2", elegant: "cormorant-latin.woff2", grotesk: "bricolage-latin.woff2" };

export function styleString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v.replace(/[;<>]/g, "")}`)
    .join(";");
}
