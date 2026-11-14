import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  // Cache Components / PPR are off: a nonce-based CSP needs every page rendered per request.
  // See docs/DECISIONS.md (2026-11-14, CSP).
  poweredByHeader: false,
  // The agent reads the template guide and copies template files into sandboxes at runtime.
  outputFileTracingIncludes: {
    "/**": ["./templates/site/**/*", "!./templates/site/node_modules/**", "!./templates/site/dist/**"],
  },
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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
