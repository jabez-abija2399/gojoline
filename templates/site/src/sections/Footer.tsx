import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";
import { badgeHref, publishMeta } from "../lib/meta";

const link = "inline-flex min-h-11 items-center underline underline-offset-4";

export function Footer() {
  const { site, lang, text, href } = useSite();
  const year = new Date().getFullYear();
  const b = site.business;
  const tel = b.phone?.replace(/[^\d+]/g, "");
  const navPages = site.pages.filter((p) => p.nav);
  const social = Object.entries(b.social ?? {}).filter((e): e is [string, string] => typeof e[1] === "string");
  const hasContact = Boolean(b.phone || b.email || b.address);
  return (
    <footer className="bg-accent text-on-accent">
      <div className="container-site grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-2xl font-bold">{text(site.name)}</p>
          {site.tagline && <p className="max-w-[40ch]">{text(site.tagline)}</p>}
          {social.length > 0 && (
            <ul className="flex flex-wrap gap-x-4">
              {social.map(([name, url]) => (
                <li key={name}>
                  <a href={url} rel="noopener noreferrer nofollow" className={`${link} capitalize`}>
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasContact && (
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{uiText("contact", lang)}</p>
            {tel && (
              <a href={`tel:${tel}`} className={link}>
                {b.phone}
              </a>
            )}
            {b.email && (
              <a href={`mailto:${b.email}`} className={`${link} break-all`}>
                {b.email}
              </a>
            )}
            {b.address && <p>{text(b.address)}</p>}
          </div>
        )}
        {(b.hours?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-1">
            <p className="font-semibold">{uiText("hours", lang)}</p>
            <ul>
              {b.hours!.map((h, i) => (
                <li key={i}>
                  {text(h.days)}: {text(h.time)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          navPages.length > 1 && (
            <nav aria-label={uiText("menu", lang)} className="flex flex-col">
              {navPages.map((p) => (
                <a key={p.path} href={href(p.path)} className={link}>
                  {text(p.nav)}
                </a>
              ))}
            </nav>
          )
        )}
      </div>
      <div className="border-t border-on-accent/20">
        <div className="container-site flex flex-col gap-x-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p suppressHydrationWarning>
            © {year} {text(site.name)}
          </p>
          <div className="flex flex-wrap gap-x-6">
            {/* The plan decides (VITE_BADGE at publish); site.json's meta.badge is ignored so the AI can't remove it. */}
            {publishMeta.badge && <MadeWith lang={lang} />}
            {/* Always present (Phase 1 trust rule); Gojoline fills the exact URL at publish time. */}
            <a href={publishMeta.reportUrl} rel="nofollow" className={link}>
              {uiText("report", lang)}
            </a>
          </div>
        </div>
      </div>
      {/* The name, very large, to close the page. */}
      {/* The elegant and bold styles close with the name, very large; drawn by CSS from data-name, so it's decoration only. */}
      {(site.theme.style === "editorial" || site.theme.style === "bold") && <p aria-hidden="true" data-name={text(site.name)} style={{ "--chars": [...text(site.name)].length } as React.CSSProperties} className="footer-wordmark container-site" />}
    </footer>
  );
}

/**
 * The small "Made with Gojoline" pill on Free sites. Inline styles keep it visible even if the
 * site's own CSS tries to hide it (publish also refuses styles that target it).
 */
function MadeWith({ lang }: { lang: "en" | "am" }) {
  return (
    <a href={badgeHref(lang)} data-gojoline-badge="" className="inline-flex min-h-11 items-center" style={{ display: "inline-flex", visibility: "visible", opacity: 1 }}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-on-accent/40 px-3 py-1 text-sm font-medium hover:bg-on-accent/10">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M2.5 7.5 8 3l5.5 4.5V13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5Z" />
        </svg>
        {uiText("madeWith", lang)}
      </span>
    </a>
  );
}
