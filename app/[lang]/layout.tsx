import { ClickTracker } from "@/components/analytics/click-tracker";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";
import { isLocale, locales } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n";
import { readTheme } from "@/lib/app/theme";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
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
    // Home-screen app on iPhone (Android and desktop use the web manifest).
    appleWebApp: { capable: true, title: "Gojoline", statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
};

/** Keeps the browser's install offer if it fires before React loads (read by components/pwa/use-install.ts). */
const EARLY_INSTALL_SCRIPT = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__gojoInstall=e});`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Reading headers makes every page render per request so the CSP nonce is applied.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const t = getMessages(lang);
  // Light, dark or the device's choice, the same everywhere (public pages and the app).
  const theme = await readTheme();
  return (
    <html lang={lang} className={`${fontVariables} h-full`}>
      <head>
        {/* Chrome can offer installing before the app's code runs: keep that offer for the install button and pop-up. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: EARLY_INSTALL_SCRIPT }} />
      </head>
      <body data-gojo-theme={theme} className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink px-4 py-3 text-white focus:not-sr-only focus:fixed focus:min-h-11 focus:px-4 focus:py-3 focus:top-2 focus:left-2"
        >
          {t.common.skipToContent}
        </a>
        {children}
        <RegisterServiceWorker />
        <ClickTracker />
      </body>
    </html>
  );
}
