import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const PAGES = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/templates", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return PAGES.flatMap((p) =>
    locales.map((lang) => ({
      url: `${base}/${lang}${p.path}`,
      changeFrequency: p.changeFrequency,
      priority: lang === "en" ? p.priority : p.priority * 0.9,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${p.path}`])) },
    })),
  );
}
