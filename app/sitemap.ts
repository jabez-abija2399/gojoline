import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return locales.map((lang) => ({
    url: `${base}/${lang}`,
    changeFrequency: "weekly",
    priority: lang === "en" ? 1 : 0.9,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}`])) },
  }));
}
