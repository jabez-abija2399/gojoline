import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, findPage } from "./App";
import { parsePath } from "./lib/i18n";
import { styleString, themeVariables } from "./lib/theme";
import type { Site } from "./lib/types";
import "./styles.css";
// Locked (not owner-editable): motion and depth shared by every site, old and new.
import "./motion.css";
import "./design.css";

const container = document.getElementById("root")!;

function start(site: Site, prerendered: boolean) {
  const { lang, path } = parsePath(window.location.pathname, site);
  const page = findPage(site, path) ?? site.pages[0]!;
  const app = (
    <StrictMode>
      <App site={site} page={page} lang={lang} />
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
} else {
  // Live preview: the whole site, loaded separately so published pages never download it.
  void import("./site").then(({ site }) => start(site, false));
}
