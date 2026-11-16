import { createContext, useContext, type ReactNode } from "react";
import { withBase } from "./base";
import { localePath, t } from "./i18n";
import type { Lang, Page, Site, Text } from "./types";

interface SiteContextValue {
  site: Site;
  page: Page;
  lang: Lang;
  /** Picks the right language from a Text value. */
  text: (value: Text | undefined) => string;
  /** Builds a link to a page path in the current language. */
  href: (path: string) => string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ site, page, lang, children }: { site: Site; page: Page; lang: Lang; children: ReactNode }) {
  const value: SiteContextValue = {
    site,
    page,
    lang,
    text: (v) => t(v, lang, site),
    href: (path) => {
      if (!path.startsWith("/") || path.startsWith("//")) return path;
      const [p = "/", hash] = path.split("#");
      const base = withBase(localePath(p, lang, site));
      return hash ? `${base}#${hash}` : base;
    },
  };
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside SiteProvider");
  return ctx;
}
