import { bakedLive, mergeLive } from "./lib/live";
import type { Site } from "./lib/types";
import data from "./site.json";

/**
 * The website's content lives in src/site.json (edited by Gojoline's AI and the owner's
 * dashboard). This file gives it its type, with the owner's quick details (dashboard → Business
 * info, as they were at publish) on top; scripts/validate.ts checks site.json at build time.
 */
export const site = mergeLive(data as Site, bakedLive());
