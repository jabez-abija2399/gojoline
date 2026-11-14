import type { Database } from "@/lib/db/client";
import { aiUsage } from "@/lib/db/schema";
import type { UsageLogger, UsageRecord } from "./usage-log";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Writes every AI request to ai_usage. Logging must never break the user's request. */
export class DbUsageLogger implements UsageLogger {
  constructor(private db: Database) {}
  async log(r: UsageRecord) {
    try {
      await this.db.insert(aiUsage).values({ ...r, projectId: r.projectId && UUID.test(r.projectId) ? r.projectId : null });
    } catch (error) {
      console.error("ai_usage insert failed", error instanceof Error ? error.message : "unknown");
    }
  }
}
