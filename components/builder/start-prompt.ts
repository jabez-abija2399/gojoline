import type { SiteLanguages } from "./language-choice";

/** What the owner typed on "Your sites", carried to the new site's chat (this tab only). */
export interface StartPrompt {
  text: string;
  languages: SiteLanguages;
}

const KEY = "gojoline:start";
const MAX_AGE_MS = 2 * 60_000;

export function saveStartPrompt(start: StartPrompt) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...start, at: Date.now() }));
  } catch {
    // Private windows may refuse storage: the owner simply types in the chat instead.
  }
}

/** Reads the waiting prompt once; a second call (or an old prompt) gives nothing. */
export function takeStartPrompt(): StartPrompt | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { text, languages, at } = data as Record<string, unknown>;
    if (typeof text !== "string" || typeof at !== "number" || Date.now() - at > MAX_AGE_MS) return null;
    const clean = text.trim().slice(0, 4000);
    const langs = Array.isArray(languages) ? languages.filter((l): l is "en" | "am" => l === "en" || l === "am") : [];
    if (!clean || langs.length === 0) return null;
    return { text: clean, languages: [...new Set(langs)] };
  } catch {
    return null;
  }
}
