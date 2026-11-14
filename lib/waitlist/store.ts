import type { WaitlistEntry } from "./schema";

export interface WaitlistStore {
  /** Adds an entry. Adding the same contact twice is not an error (idempotent). */
  add(entry: WaitlistEntry): Promise<void>;
  count(): Promise<number>;
}

/** In-process store for development and tests. Production uses the Postgres store (Slice 2). */
export class MemoryWaitlistStore implements WaitlistStore {
  private entries = new Map<string, WaitlistEntry>();
  async add(entry: WaitlistEntry) {
    const key = `${entry.contact.kind}:${entry.contact.value}`;
    if (!this.entries.has(key)) this.entries.set(key, entry);
  }
  async count() {
    return this.entries.size;
  }
}
