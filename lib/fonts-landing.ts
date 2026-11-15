import { Fraunces } from "next/font/google";

// The landing page's display face: a warm serif for headlines (Latin only; Ge'ez headlines keep
// Noto Sans Ethiopic). Imported only by the landing page, so only that page preloads it.
export const serif = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-serif",
  preload: true,
});
