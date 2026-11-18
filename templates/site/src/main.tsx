import { StrictMode, useEffect, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, findPage } from "./App";
import { parsePath, uiText } from "./lib/i18n";
import { bakedLive, countVisit, fetchLive, liveChange, mergeLive } from "./lib/live";
import { publishMeta } from "./lib/meta";
import type { Text } from "./lib/types";
import { styleString, themeVariables } from "./lib/theme";
import type { Lang, Page, Site } from "./lib/types";
import "./styles.css";
// Locked (not owner-editable): motion and depth shared by every site, old and new.
import "./motion.css";
import "./design.css";

const container = document.getElementById("root")!;

/**
 * The owner's quick details at runtime. The pages were built with what was set at publish, so
 * usually nothing changes; new details re-render, and banner lines that arrived late slide in
 * over the page (no layout shift). The resting page is the host's job where it can (Cloudflare).
 */
function Live({ site, page, lang }: { site: Site; page: Page; lang: Lang }) {
  const [shown, setShown] = useState(site);
  const [late, setLate] = useState<Text[]>([]);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    void fetchLive().then((live) => {
      if (!live) return;
      if (live.offline && !publishMeta.restAtHost) return setOffline(true);
      const baked = bakedLive();
      const change = liveChange(baked, live);
      if (!change) return;
      // A baked banner line the owner has since removed goes (rare; the only change that moves things).
      const dropped = baked.announcement && change.keep.length !== baked.announcement.length;
      if (change.business || dropped) setShown(mergeLive(site, { business: change.business ?? site.business, ...(dropped ? { announcement: change.keep } : {}) }));
      setLate(change.late);
    });
  }, [site]);
  if (offline) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-3xl font-semibold">{uiText("restingTitle", lang)}</h1>
        <p className="max-w-[40ch] text-muted">{uiText("restingBody", lang)}</p>
      </main>
    );
  }
  return (
    <>
      <App site={shown} page={page} lang={lang} />
      {late.length > 0 && (
        <div role="status" className="late-banner fixed inset-x-0 top-0 z-[60] flex items-center gap-2 bg-accent px-4 py-2 text-on-accent shadow-lg">
          <ul className="flex-1 text-center text-sm font-semibold">{late.map((l, i) => <li key={i}>{l[lang] ?? l.en ?? l.am}</li>)}</ul>
          <button type="button" onClick={() => setLate([])} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full" aria-label={uiText("close", lang)}>
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>
      )}
    </>
  );
}

function start(site: Site, prerendered: boolean) {
  const { lang, path } = parsePath(window.location.pathname, site);
  const page = findPage(site, path) ?? site.pages[0]!;
  const app = (
    <StrictMode>
      <Live site={site} page={page} lang={lang} />
    </StrictMode>
  );
  if (prerendered) {
    hydrateRoot(container, app);
  } else {
    // Live preview (dev server): render on the client and apply theme variables.
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("style", styleString(themeVariables(site.theme, lang)));
    createRoot(container).render(app);
  }
}

const data = document.getElementById("site-data")?.textContent;
if (container.firstElementChild && data) {
  // Published page: its own content is in the page, so the script doesn't carry the whole site.
  start(JSON.parse(data) as Site, true);
  if (document.readyState === "complete") countVisit();
  else addEventListener("load", countVisit, { once: true });
} else if (import.meta.env.DEV) {
  // Live preview (the dev server only): the whole site. Published builds leave this chunk out,
  // since every published page is prerendered with its own content.
  void import("./site").then(({ site }) => start(site, false));
}
