import { Inter, Outfit } from "next/font/google";
import localFont from "next/font/local";

// Self-hosted at build time by next/font. Only the heading font is preloaded (docs/QUALITY.md).
export const outfit = Outfit({
  subsets: ["latin"],
  // Variable font (one file): the landing page sets headings at 600, the app at 700.
  weight: "variable",
  display: "swap",
  variable: "--font-outfit",
  preload: true,
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
});

// Subset of Noto Sans Ethiopic (core Ge'ez block, weights 400-700): see app/fonts/README.md.
export const ethiopic = localFont({
  src: "../app/fonts/noto-sans-ethiopic-core.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-ethiopic",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+1200-137F" }],
});

export const fontVariables = `${outfit.variable} ${inter.variable} ${ethiopic.variable}`;
