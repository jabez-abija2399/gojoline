import { languageNames, localePath, uiText } from "../lib/i18n";
import { useSite } from "../lib/context";

/** `overlay`: the page opens with a full-screen photo, so the header sits on it in white. */
export function Header({ overlay = false, framed = false }: { overlay?: boolean; /** The home hero opens from a frame: the header sits inside it. */ framed?: boolean }) {
  const { site, page, lang, text, href } = useSite();
  const navPages = site.pages.filter((p) => p.nav);
  const otherLangs = site.languages.filter((l) => l !== lang);
  // The home page's main action (book, order, give) stays one click away on computers.
  const home = site.pages.find((p) => p.path === "/")?.sections[0];
  const main = home?.type === "hero" ? home.primaryAction : undefined;
  const mainHref = main ? (main.href.startsWith("#") ? `/${main.href}` : main.href) : "";

  const links = navPages.map((p) => (
    <a
      key={p.path}
      href={href(p.path)}
      aria-current={p.path === page.path ? "page" : undefined}
      className="nav-link flex min-h-11 items-center rounded-site px-3 font-medium"
    >
      {text(p.nav)}
    </a>
  ));

  const switcher = otherLangs.map((l) => (
    <a
      key={l}
      href={localePath(page.path, l, site)}
      lang={l}
      hrefLang={l}
      className="nav-link nav-lang flex min-h-11 items-center rounded-site border px-3 font-medium"
    >
      {languageNames[l]}
    </a>
  ));

  return (
    <header className={overlay ? `site-header header-overlay absolute inset-x-0 top-0 z-20 text-white ${framed ? "md:top-5" : ""}` : "site-header header-scroll sticky top-0 z-20 border-b border-line bg-background/95 backdrop-blur"}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-site focus:bg-surface focus:px-4 focus:py-3 focus:text-text">
        {uiText("skip", lang)}
      </a>
      <div className="container-site flex items-center justify-between gap-3 py-2">
        <a href={href("/")} className="wordmark flex min-h-11 min-w-0 items-center gap-2.5 font-heading text-lg leading-tight font-bold min-[480px]:text-xl">
          <span aria-hidden="true" className="brand-mark">
            {[...text(site.name).trim()][0]?.toUpperCase()}
          </span>
          <span className="line-clamp-2">{text(site.name)}</span>
        </a>
        <nav aria-label={uiText("pages", lang)} className="nav-desktop hidden items-center gap-1 md:flex">
          {links}
          {switcher}
          {main && (
            <a href={href(mainHref)} className={`btn btn-primary header-cta ms-2 whitespace-nowrap max-lg:hidden ${page.path === "/" ? "header-cta-late" : ""}`}>
              {text(main.label)}
            </a>
          )}
        </nav>
        {(navPages.length > 0 || otherLangs.length > 0) && (
          <details
            className="group relative md:hidden"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.currentTarget.open = false;
                e.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-site border border-current/30 px-3 font-medium [&::-webkit-details-marker]:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 min-[400px]:me-2" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="max-[399px]:sr-only">{uiText("pages", lang)}</span>
            </summary>
            <nav
              aria-label={uiText("pages", lang)}
              className="absolute right-0 mt-2 flex max-h-[calc(100dvh-5rem)] w-56 flex-col gap-1 overflow-y-auto rounded-site border border-line bg-surface p-2 text-text shadow-lg"
            >
              {links}
              {switcher}
            </nav>
          </details>
        )}
      </div>
    </header>
  );
}
