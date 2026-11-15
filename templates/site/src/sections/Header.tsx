import { languageNames, localePath, uiText } from "../lib/i18n";
import { useSite } from "../lib/context";

export function Header() {
  const { site, page, lang, text, href } = useSite();
  const navPages = site.pages.filter((p) => p.nav);
  const otherLangs = site.languages.filter((l) => l !== lang);

  const links = navPages.map((p) => (
    <a
      key={p.path}
      href={href(p.path)}
      aria-current={p.path === page.path ? "page" : undefined}
      className="flex min-h-11 items-center rounded-site px-3 font-medium hover:bg-primary-soft aria-[current=page]:text-primary"
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
      className="flex min-h-11 items-center rounded-site border border-line px-3 font-medium hover:bg-primary-soft"
    >
      {languageNames[l]}
    </a>
  ));

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30 focus:rounded-site focus:bg-surface focus:px-4 focus:py-3">
        {uiText("skip", lang)}
      </a>
      <div className="container-site flex items-center justify-between gap-3 py-2">
        <a href={href("/")} className="flex min-h-11 items-center font-heading text-xl font-bold">
          {text(site.name)}
        </a>
        <nav aria-label={uiText("pages", lang)} className="hidden items-center gap-1 md:flex">
          {links}
          {switcher}
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
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-site border border-line px-3 font-medium [&::-webkit-details-marker]:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="me-2 size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>{uiText("pages", lang)}</span>
            </summary>
            <nav
              aria-label={uiText("pages", lang)}
              className="absolute right-0 mt-2 flex w-56 flex-col gap-1 rounded-site border border-line bg-surface p-2 shadow-lg"
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
