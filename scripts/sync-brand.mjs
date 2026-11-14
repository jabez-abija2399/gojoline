// Copies the brand assets the app serves from `brand/` (source of truth) into `public/` and `app/`.
// Run `npm run brand:sync` after changing anything in `brand/`. A unit test checks the copies match.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export const BRAND_COPIES = [
  ["brand/icons/favicon.ico", "app/favicon.ico"],
  ["brand/icons/favicon.svg", "app/icon.svg"],
  ["brand/png/icons/apple-touch-icon.png", "app/apple-icon.png"],
  ["brand/png/icons/icon-192.png", "public/brand/icon-192.png"],
  ["brand/png/icons/app-icon-512.png", "public/brand/icon-512.png"],
  ["brand/png/icons/maskable-icon-192.png", "public/brand/maskable-192.png"],
  ["brand/png/icons/maskable-icon-512.png", "public/brand/maskable-512.png"],
  ["brand/png/social/og-image-1200x630.png", "public/brand/og-image.png"],
  ["brand/logo/gojoline-logo.svg", "public/brand/logo.svg"],
  ["brand/logo/gojoline-logo-amharic.svg", "public/brand/logo-am.svg"],
  ["brand/logo/gojoline-logo-reversed.svg", "public/brand/logo-reversed.svg"],
  ["brand/logo/gojoline-logo-amharic-reversed.svg", "public/brand/logo-am-reversed.svg"],
  ["brand/logo/gojoline-mark.svg", "public/brand/mark.svg"],
];

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [from, to] of BRAND_COPIES) {
    mkdirSync(dirname(join(process.cwd(), to)), { recursive: true });
    copyFileSync(from, to);
  }
  console.log(`Copied ${BRAND_COPIES.length} brand assets.`);
}
