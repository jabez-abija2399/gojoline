import type { SettingsStore } from "@/lib/billing/settings";
import { KIT_IDS } from "./telegram-kit";

const KEY = "posts.kit";

/** Which Telegram starter posts are done (app_settings "posts.kit": id → when). */
export class KitStore {
  constructor(private readonly settings: SettingsStore) {}

  async posted(): Promise<Record<string, string>> {
    const v = ((await this.settings.get(KEY)) ?? {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(v).filter(([k, t]) => KIT_IDS.includes(k) && typeof t === "string")) as Record<string, string>;
  }

  async mark(id: string, done: boolean, by: string, now = new Date()) {
    if (!KIT_IDS.includes(id)) return;
    if (done) await this.settings.merge(KEY, { [id]: now.toISOString() }, [], by, {});
    else await this.settings.merge(KEY, {}, [id], by, null);
  }
}
