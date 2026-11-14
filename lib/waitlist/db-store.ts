import { sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { waitlist } from "@/lib/db/schema";
import type { WaitlistEntry } from "./schema";
import type { WaitlistStore } from "./store";

export class DbWaitlistStore implements WaitlistStore {
  constructor(private db: Database) {}
  async add(entry: WaitlistEntry) {
    await this.db
      .insert(waitlist)
      .values({ name: entry.name, contactKind: entry.contact.kind, contactValue: entry.contact.value, business: entry.business, locale: entry.locale })
      .onConflictDoNothing({ target: waitlist.contactValue });
  }
  async count() {
    const [row] = await this.db.select({ n: sql<number>`count(*)::int` }).from(waitlist);
    return row?.n ?? 0;
  }
}
