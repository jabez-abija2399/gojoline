import { StrictMode, useEffect, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, findPage } from "./App";
import { parsePath, uiText } from "./lib/i18n";
import { countVisit, fetchLive, mergeLive, type LiveInfo } from "./lib/live";
import { styleString, themeVariables } from "./lib/theme";
import type { Lang, Page, Site } from "./lib/types";
import "./styles.css";
// Locked (not owner-editable): motion and depth shared by every site, old and new.
import "./motion.css";
import "./design.css";

const container = document.getElementById("root")!;

/** The owner's quick details (contact, hours, banner) over the built-in ones, or the resting page. */
function Live({ site, page, lang }: { site: Site; page: Page; lang: Lang }) {
  const [live, setLive] = useState<LiveInfo | null>(null);
  useEffect(() => void fetchLive().then(setLive), []);
  if (live?.offline) {
    return (
      <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-3xl font-semibold">{uiText("restingTitle", lang)}</h1>
        <p className="max-w-[40ch] text-muted">{uiText("restingBody", lang)}</p>
      </main>
    );
  }
  return <App site={live ? mergeLive(site, live) : site} page={page} lang={lang} />;
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
} else {
  // Live preview: the whole site, loaded separately so published pages never download it.
  void import("./site").then(({ site }) => start(site, false));
}
