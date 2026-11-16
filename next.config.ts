import type { NextConfig } from "next";
import { demoHeaders, securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  // Cache Components / PPR are off: a nonce-based CSP needs every page rendered per request.
  // See docs/DECISIONS.md (2026-11-14, CSP).
  poweredByHeader: false,
  // The agent reads the template guide and copies template files into sandboxes at runtime.
  // Explicit folders only: negated globs are ignored here, and the template's node_modules
  // (~90 MB) must never ship inside the app's functions.
  outputFileTracingIncludes: {
    "/**": ["./templates/site/{src,public,scripts,presets}/**/*", "./templates/site/*.{json,ts,html,md}"],
  },
  outputFileTracingExcludes: {
    "/**": ["./templates/site/node_modules/**", "./templates/site/dist*/**", "./templates/site/test/**"],
  },
  // Sentry loads its own runtime hooks; bundling it breaks them and triples its size.
  serverExternalPackages: ["@sentry/nextjs", "@sentry/node"],
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Live template demos (public/demo/<id>/, built by scripts/template-demos.mjs): shown in a
      // frame on Gojoline's own preview pages only, with the same strict policy as published sites,
      // and kept out of search engines. Later entries override the same header above.
      { source: "/demo/:path*", headers: demoHeaders },
    ];
  },
  async rewrites() {
    // A demo page is a folder with an index.html; files (scripts, photos, fonts) are served as they are.
    return [
      { source: "/demo/:id", destination: "/demo/:id/index.html" },
      { source: "/demo/:id/:page*", destination: "/demo/:id/:page*/index.html" },
    ];
  },
};

export default nextConfig;
