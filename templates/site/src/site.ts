import type { Site } from "./lib/types";
import data from "./site.json";

/**
 * The website's content lives in src/site.json (edited by Gojoline's AI and the owner's
 * dashboard). This file only gives it its type; scripts/validate.ts checks it at build time.
 */
export const site = data as Site;
