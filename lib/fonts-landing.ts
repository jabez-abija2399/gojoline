import { Fraunces } from "next/font/google";

// The landing page's display face: a warm serif for headlines (Latin only; Ge'ez headlines keep
// Noto Sans Ethiopic). Imported only by the landing page.
export const serif = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-serif",
  // Not preloaded: Amharic pages never use it, and on English pages the titles are sized
  // so that its arrival doesn't re-wrap them (measured).
  preload: false,
});
