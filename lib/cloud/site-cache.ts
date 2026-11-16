import type { BusinessInfo } from "@/lib/site-info/business";
import type { PublicSite } from "./types";

export interface PublicEntry {
  site: PublicSite;
  business: BusinessInfo | null;
}

/**
 * What the public Data API needs per page view (status, key, origins, offline, business info),
 * kept for a minute per server so a view isn't a database query. Publishing, the offline
 * switch, a takedown and saving business info drop the entry here; other servers catch up
 * within the minute.
 */
export class PublicSiteCache {
  private entries = new Map<string, { at: number; value: PublicEntry | null }>();
  constructor(
    private load: (projectId: string) => Promise<PublicEntry | null>,
    private ttlMs = 60_000,
    private max = 5_000,
    private now: () => number = Date.now,
  ) {}

  async get(projectId: string): Promise<PublicEntry | null> {
    const hit = this.entries.get(projectId);
    if (hit && this.now() - hit.at < this.ttlMs) return hit.value;
    const value = await this.load(projectId);
    this.entries.delete(projectId);
    // Oldest out first (insertion order).
    while (this.entries.size >= this.max) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(projectId, { at: this.now(), value });
    return value;
  }

  invalidate(projectId: string) {
    this.entries.delete(projectId);
  }
}
