import { describe, expect, it } from "vitest";
import { aiUsage } from "@/lib/db/schema";
import { testDb } from "@/test/db";
import { DbUsageLogger } from "./db-usage-log";

describe("DbUsageLogger", () => {
  it("stores tokens and integer cost", async () => {
    const db = await testDb();
    const logger = new DbUsageLogger(db);
    await logger.log({
      userId: "u1", projectId: "not-a-uuid", purpose: "agent", model: "claude-opus-5-5",
      inputTokens: 10, outputTokens: 20, cacheReadTokens: 8000, cacheWriteTokens: 0,
      costNanoUsd: 2_040_000, durationMs: 1200, firstTokenMs: 900, stopReason: "end_turn", ok: true, createdAt: new Date(),
    });
    const [row] = await db.select().from(aiUsage);
    expect(row).toMatchObject({ costNanoUsd: 2_040_000, cacheReadTokens: 8000, projectId: null });
  }, 30_000);
});
