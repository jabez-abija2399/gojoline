import type { MetadataRoute } from "next";

/** Installable app: opens like a native app from the home screen (Android, iPhone, desktop). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Gojoline · ጎጆላይን",
    short_name: "Gojoline",
    description: "Describe your business. Get your home online. · ስለ ንግድዎ ይንገሩን፤ ጎጆዎን ኦንላይን ያድርጉ።",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#FBF9F6",
    theme_color: "#121212",
    categories: ["business", "productivity"],
    lang: "en",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My sites · ድረ-ገጾቼ", url: "/en/build", icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
      { name: "Plan · ዕቅድ", url: "/en/billing", icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
