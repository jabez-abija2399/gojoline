/** "Not now" hides the install pop-up this long. */
export const INSTALL_SNOOZE_MS = 14 * 86_400_000;

/** What the browser remembers about the install pop-up (localStorage, per device). */
export interface InstallMemory {
  /** Installed, or the browser's own prompt was answered: never ask again. */
  never: boolean;
  /** "Not now": hidden until this time (ms since 1970). */
  snoozedUntil: number;
  /** Separate visits (browser sessions) to the signed-in app on this device. */
  visits: number;
  /** The owner's first site was made or published on this device. */
  goodMoment: boolean;
}

export const EMPTY_MEMORY: InstallMemory = { never: false, snoozedUntil: 0, visits: 0, goodMoment: false };

/** Reads stored memory, tolerating anything (old versions, hand edits, blocked storage). */
export function parseMemory(raw: string | null): InstallMemory {
  if (!raw) return EMPTY_MEMORY;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof InstallMemory, unknown>>;
    return {
      never: v.never === true,
      snoozedUntil: typeof v.snoozedUntil === "number" && Number.isFinite(v.snoozedUntil) ? v.snoozedUntil : 0,
      visits: typeof v.visits === "number" && Number.isInteger(v.visits) && v.visits >= 0 ? Math.min(v.visits, 1000) : 0,
      goodMoment: v.goodMoment === true,
    };
  } catch {
    return EMPTY_MEMORY;
  }
}

/**
 * Whether the install pop-up shows: only where installing is possible (the browser offered its
 * prompt, or iPhone Safari's two steps), never inside the installed app, never while the AI is
 * working, and only at a good moment: after the first site was made or published, or from the
 * second visit on (so never on the first page anyone sees).
 */
export function shouldShowInstall(s: { standalone: boolean; canPrompt: boolean; ios: boolean; busy: boolean; memory: InstallMemory; now: number }): boolean {
  if (s.standalone || s.busy) return false;
  if (!s.canPrompt && !s.ios) return false;
  if (s.memory.never || s.memory.snoozedUntil > s.now) return false;
  return s.memory.goodMoment || s.memory.visits >= 2;
}
