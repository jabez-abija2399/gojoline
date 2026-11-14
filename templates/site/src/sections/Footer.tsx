import { uiText } from "../lib/i18n";
import { useSite } from "../lib/context";

export function Footer() {
  const { site, lang, text } = useSite();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-accent text-on-accent">
      <div className="container-site flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-heading text-xl font-bold">{text(site.name)}</p>
          {site.tagline && <p className="opacity-90">{text(site.tagline)}</p>}
          <p className="opacity-90" suppressHydrationWarning>
            © {year} {text(site.name)}
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          {site.meta?.badge !== false && (
            <a href="https://gojoline.com" className="flex min-h-11 items-center underline underline-offset-4">
              {uiText("madeWith", lang)}
            </a>
          )}
          {site.meta?.reportUrl && (
            <a href={site.meta.reportUrl} rel="nofollow" className="flex min-h-11 items-center underline underline-offset-4">
              {uiText("report", lang)}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
