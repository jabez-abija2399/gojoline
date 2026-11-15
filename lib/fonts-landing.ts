import { Fraunces } from "next/font/google";

// The landing page's display face: a warm serif for headlines (Latin only; Ge'ez headlines keep
// Noto Sans Ethiopic). Imported only by the landing page.
export const serif = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-serif",
  // Not preloaded: Amharic pages never use it, and on English pages its arrival moves the
  // headline by under 0.004 (measured).
  preload: false,
});
