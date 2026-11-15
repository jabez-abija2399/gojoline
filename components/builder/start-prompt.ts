import type { SiteLanguages } from "./language-choice";

/** What the owner typed on "Your sites", carried to the new site's chat (this tab only). */
export interface StartPrompt {
  text: string;
  languages: SiteLanguages;
}

const KEY = "gojoline:start";
const MAX_AGE_MS = 30_000;
// Typed on the landing page before signing in: signing in can take a few minutes.
const LANDING_KEY = "gojoline:landing";
const LANDING_MAX_AGE_MS = 5 * 60_000;

function save(key: string, start: StartPrompt) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ...start, at: Date.now() }));
  } catch {
    // Private windows may refuse storage: the owner simply types in the chat instead.
  }
}

/** Reads a waiting prompt once; a second call (or an old prompt) gives nothing. */
function take(key: string, maxAge: number): StartPrompt | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { text, languages, at } = data as Record<string, unknown>;
    if (typeof text !== "string" || typeof at !== "number" || Date.now() - at > maxAge) return null;
    const clean = text.trim().slice(0, 4000);
    const langs = Array.isArray(languages) ? languages.filter((l): l is "en" | "am" => l === "en" || l === "am") : [];
    if (!clean || langs.length === 0) return null;
    return { text: clean, languages: [...new Set(langs)] };
  } catch {
    return null;
  }
}

export const saveStartPrompt = (start: StartPrompt) => save(KEY, start);
export const takeStartPrompt = () => take(KEY, MAX_AGE_MS);
/** The landing page's "Build my site": kept while the visitor signs in, then handed to "Your sites". */
export const saveLandingPrompt = (start: StartPrompt) => save(LANDING_KEY, start);
export const takeLandingPrompt = () => take(LANDING_KEY, LANDING_MAX_AGE_MS);

const PRESET_KEY = "gojoline:preset";

/** "Start from this" on the landing page: which real site the visitor picked. */
export function savePresetChoice(id: string) {
  try {
    sessionStorage.setItem(PRESET_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    // Without storage the visitor picks the template again on "Your sites".
  }
}

/** Reads the picked template once (5 minutes at most). */
export function takePresetChoice(): string | null {
  try {
    const raw = sessionStorage.getItem(PRESET_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PRESET_KEY);
    const data = JSON.parse(raw) as { id?: unknown; at?: unknown } | null;
    if (!data || typeof data.id !== "string" || typeof data.at !== "number" || Date.now() - data.at > LANDING_MAX_AGE_MS) return null;
    return /^[a-z-]{1,30}$/.test(data.id) ? data.id : null;
  } catch {
    return null;
  }
}

/** Opening the landing page again drops a description nobody followed through on. */
export function clearLandingPrompt() {
  try {
    sessionStorage.removeItem(LANDING_KEY);
    sessionStorage.removeItem(PRESET_KEY);
  } catch {
    // Nothing was stored.
  }
}

/** Forgets a prompt that never reached a new site (creating it was refused, or sign-in expired). */
export function clearStartPrompt() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing was stored.
  }
}
