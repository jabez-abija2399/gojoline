// Small helpers so a preset reads as content, not brackets.
import { writeFileSync } from "node:fs";
export const t = (en, am) => ({ en, am });
export const img = (name, en, am) => ({ src: `/stock/${name}.webp`, alt: t(en, am) });
export const link = (en, am, href) => ({ label: t(en, am), href });
export const birr = (n) => ({ amountMinor: n * 100, currency: "ETB" });
export const save = (id, site) => writeFileSync(`/home/user/gojoline/templates/site/presets/${id}.json`, JSON.stringify(site, null, 2) + "\n");
