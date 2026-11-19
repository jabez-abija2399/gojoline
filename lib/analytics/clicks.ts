/**
 * Which clicks the admin analytics count, and how a click is named. A click is named by where the
 * link goes (or a `data-track` name on the element) and the kind of page it was on. Only these
 * names are accepted by `/api/track`; everything else is ignored, so no URL or text is ever stored.
 */
export const CLICK_NAMES = [
  "start",
  "use_template",
  "template",
  "templates",
  "pricing",
  "guide",
  "showcase",
  "showcase_site",
  "plan",
  "feedback",
  "report",
  "sector",
  "telegram",
  "share_telegram",
  "invite_copy",
  "share_site",
] as const;
export type ClickName = (typeof CLICK_NAMES)[number];

export const CLICK_PAGES = ["landing", "templates", "pricing", "guide", "showcase", "sector", "builder", "dashboard", "billing", "other"] as const;
export type ClickPage = (typeof CLICK_PAGES)[number];

const isName = (x: string): x is ClickName => (CLICK_NAMES as readonly string[]).includes(x);

/** The kind of page from its path (`/en/templates/cafe` → templates); null on admin pages (never counted). */
export function pageOf(pathname: string): ClickPage | null {
  const [, , first = ""] = pathname.split("/");
  switch (first) {
    case "":
      return "landing";
    case "admin":
      return null;
    case "templates":
    case "pricing":
    case "guide":
    case "showcase":
    case "billing":
    case "dashboard":
      return first;
    case "website-for":
      return "sector";
    case "build":
      return "builder";
    default:
      return "other";
  }
}

/** The click's name from the link's address, or null when that kind of link isn't counted. */
export function nameOf(href: string, page: ClickPage, origin: string): ClickName | null {
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.hostname === "t.me") return url.pathname.startsWith("/share") ? "share_telegram" : "telegram";
  if (url.origin !== origin) return null;
  const [, , first = "", second = ""] = url.pathname.split("/");
  switch (first) {
    case "sign-in":
      return "start";
    // Inside the app, links to the sites list are just moving around.
    case "build":
      return page === "builder" || page === "dashboard" || page === "billing" ? null : "start";
    case "templates":
      return second ? "template" : "templates";
    case "pricing":
      return "pricing";
    case "guide":
      return "guide";
    case "showcase":
      return "showcase";
    case "billing":
      return "plan";
    case "feedback":
      return "feedback";
    case "report":
      return "report";
    case "website-for":
      return "sector";
    default:
      return null;
  }
}

/** What a click on `target` counts as, or null. A `data-track` name wins over the link's address. */
export function classifyClick(target: { track?: string | null; href?: string | null }, pathname: string, origin: string): { name: ClickName; page: ClickPage } | null {
  const page = pageOf(pathname);
  if (!page) return null;
  if (target.track) return isName(target.track) ? { name: target.track, page } : null;
  if (!target.href) return null;
  const name = nameOf(target.href, page, origin);
  return name ? { name, page } : null;
}

/** The stored key: `name:page`. */
export const clickKey = (name: ClickName, page: ClickPage) => `${name}:${page}`;

export function parseClickKey(key: string): { name: ClickName; page: ClickPage } | null {
  const [name = "", page = ""] = key.split(":");
  return isName(name) && (CLICK_PAGES as readonly string[]).includes(page) ? { name, page: page as ClickPage } : null;
}
