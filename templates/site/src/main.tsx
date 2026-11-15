import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App, findPage } from "./App";
import { parsePath } from "./lib/i18n";
import { styleString, themeVariables } from "./lib/theme";
import { site } from "./site";
import "./styles.css";
// Locked (not owner-editable): motion and depth shared by every site, old and new.
import "./motion.css";

const container = document.getElementById("root")!;
const { lang, path } = parsePath(window.location.pathname, site);
const page = findPage(site, path) ?? site.pages[0]!;
const app = (
  <StrictMode>
    <App site={site} page={page} lang={lang} />
  </StrictMode>
);

if (container.firstElementChild) {
  // Prerendered page (published site).
  hydrateRoot(container, app);
} else {
  // Live preview (dev server): render on the client and apply theme variables.
  document.documentElement.lang = lang;
  document.documentElement.setAttribute("style", styleString(themeVariables(site.theme, lang)));
  createRoot(container).render(app);
}
