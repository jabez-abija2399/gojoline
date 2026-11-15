import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getMessages(lang);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.title, template: `%s · ${t.common.logoAlt}` },
    description: t.meta.description,
    applicationName: "Gojoline",
    alternates: {
      canonical: `/${lang}`,
      languages: { en: "/en", am: "/am", "x-default": "/en" },
    },
    openGraph: {
      type: "website",
      siteName: "Gojoline",
      title: t.meta.title,
      description: t.meta.description,
      locale: lang === "am" ? "am_ET" : "en_US",
      images: [{ url: "/brand/og-image.png", width: 1200, height: 630, alt: t.common.logoAlt }],
    },
    twitter: { card: "summary_large_image", images: ["/brand/og-image.png"] },
  };
}

export const viewport: Viewport = {
  themeColor: "#0E3B43",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Reading headers makes every page render per request so the CSP nonce is applied.
  await headers();
  const t = getMessages(lang);
  return (
    <html lang={lang} className={`${fontVariables} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-teal px-4 py-3 text-white focus:not-sr-only focus:fixed focus:min-h-11 focus:px-4 focus:py-3 focus:top-2 focus:left-2"
        >
          {t.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
