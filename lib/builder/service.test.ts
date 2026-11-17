import { describe, expect, it } from "vitest";
import { siteName } from "./service";

describe("siteName", () => {
  const ts = JSON.stringify({ name: { en: "Selam Coffee", am: "ሰላም ቡና" }, tagline: { en: "x" } });
  it("prefers the project language", () => {
    expect(siteName(ts, "en")).toBe("Selam Coffee");
    expect(siteName(ts, "am")).toBe("ሰላም ቡና");
  });
  it("falls back to the other language, or null", () => {
    expect(siteName(JSON.stringify({ name: { am: "ጀበና" } }), "en")).toBe("ጀበና");
    expect(siteName("not json", "en")).toBeNull();
  });
});

import { readFileSync } from "node:fs";
import { Billing } from "@/lib/billing/service";
import { MemoryBillingStore } from "@/lib/billing/store";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { DemoLLMProvider } from "@/lib/providers/llm/demo";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { sendOwnerMessage, type BuilderDeps, type BuilderEvent } from "./service";
import { HeuristicSizer } from "@/lib/agent/size";
import { toolUseBlock } from "@/lib/providers/llm/fake";
import { costNanoUsd } from "@/lib/providers/llm/pricing";
import { MAX_FIRST_BUILD_CAP_CENTS } from "@/lib/billing/credits";

describe("AI edit credits", () => {
  const starter = readFileSync("templates/site/src/site.json", "utf8");
  async function setup() {
    const billing = new Billing(new MemoryBillingStore());
    const deps: BuilderDeps = {
      store: new MemoryProjectStore(),
      sandboxes: new MemorySandboxProvider({ "src/site.json": starter }),
      llm: new DemoLLMProvider(),
      usage: new MemoryUsageLogger(),
      model: "claude-opus-5-5",
      lock: new MemoryLock(),
      credits: { consume: (u, r) => billing.consumeEdit(u, r), refund: (u, r) => billing.refundEdit(u, r), freeFirstBuild: (u, r) => billing.freeFirstBuild(u, r) },
    };
    const newProject = async () => (await deps.store.createProject("u", { name: "", locale: "en" })).id;
    const p = await newProject();
    const send = async (text: string, projectId = p) => {
      const events: BuilderEvent[] = [];
      await sendOwnerMessage(deps, { ownerId: "u", projectId, text, onEvent: (e) => events.push(e) });
      return events.at(-1)!;
    };
    return { billing, send, newProject };
  }

  it("builds the first version free, then charges one credit per change and refunds failed changes", async () => {
    const { billing, send } = await setup();
    expect(await billing.creditsLeft("u")).toBe(10);
    expect((await send("Selam Cafe")).type).toBe("done");
    expect(await billing.creditsLeft("u")).toBe(10);
    expect((await send("Make the title bigger")).type).toBe("done");
    expect(await billing.creditsLeft("u")).toBe(9);
    const failed = await send("break it");
    expect(failed.type === "done" && failed.message.status).toBe("failed");
    expect(await billing.creditsLeft("u")).toBe(9);
  });

  it("lets an owner with no changes left build a new site, but not change it", async () => {
    const { billing, send } = await setup();
    for (let i = 0; i < 10; i++) await billing.consumeEdit("u", `pre-${i}`);
    expect((await send("Selam Cafe")).type).toBe("done");
    expect(await send("Make the title bigger")).toEqual({ type: "error", code: "no_credits", credits: 0 });
  });

  it("gives one free first build per site the plan allows, each month", async () => {
    const { billing, send, newProject } = await setup();
    expect((await send("Selam Cafe", await newProject())).type).toBe("done");
    expect(await billing.creditsLeft("u")).toBe(10);
    expect((await send("Selam Cafe", await newProject())).type).toBe("done");
    expect(await billing.creditsLeft("u")).toBe(9);
  });
});

describe("changes by request size", () => {
  const starter = readFileSync("templates/site/src/site.json", "utf8");
  async function setup() {
    const billing = new Billing(new MemoryBillingStore());
    const deps: BuilderDeps = {
      store: new MemoryProjectStore(),
      sandboxes: new MemorySandboxProvider({ "src/site.json": starter }),
      llm: new DemoLLMProvider(),
      usage: new MemoryUsageLogger(),
      model: "claude-opus-5-5",
      lock: new MemoryLock(),
      credits: {
        consume: (u, r, n, meta) => billing.consumeEdit(u, r, n, meta),
        refund: (u, r, n, meta) => billing.refundEdit(u, r, n, meta),
        left: (u) => billing.creditsLeft(u),
        freeFirstBuild: (u, r) => billing.freeFirstBuild(u, r),
        pricing: async () => ({ sizeCredits: (await billing.credits()).sizeCredits, capCentsPerCredit: 15, firstBuildCapCents: 75 }),
      },
      sizer: new HeuristicSizer(),
    };
    const p = (await deps.store.createProject("u", { name: "", locale: "en" })).id;
    // By default the owner agrees to the cost shown for that size (2 or 4).
    const send = async (text: string, confirmSize?: "medium" | "large", confirmCost = confirmSize ? { medium: 2, large: 4 }[confirmSize] : undefined) => {
      const events: BuilderEvent[] = [];
      await sendOwnerMessage(deps, { ownerId: "u", projectId: p, text, confirmSize, confirmCost, onEvent: (e) => events.push(e) });
      return events.at(-1)!;
    };
    // The first build is free whatever its size, and never asks.
    expect((await send("Redesign the whole website")).type).toBe("done");
    return { billing, deps, send, p };
  }

  it("asks again when the cost went up after the owner agreed", async () => {
    const { billing, send } = await setup();
    // The owner agreed to 2; an admin has since made medium requests cost 3.
    await billing.saveCreditSettings("admin", { ...(await billing.credits()), sizeCredits: { small: 1, medium: 3, large: 4 } });
    expect(await send("Add a new page for our catering", "medium", 2)).toMatchObject({ type: "needs_confirm", cost: 3 });
    expect(await send("Add a new page for our catering", "medium")).toMatchObject({ type: "needs_confirm", cost: 3 });
    expect(await send("Add a new page for our catering", "medium", 3)).toMatchObject({ type: "done", charged: 3 });
  });

  it("doesn't give back a request stopped at its cost cap; the owner is told to split it", async () => {
    const { billing, deps, send } = await setup();
    // A model that writes a broken file at great cost: the cap stops it, the build fails, the site is restored.
    deps.llm = {
      complete: async (req) => {
        const usage = { inputTokens: 20_000, outputTokens: 1000, cacheReadTokens: 0, cacheWriteTokens: 0 };
        return { content: [toolUseBlock("write_file", { path: "src/site.json", content: "BROKEN" })], stopReason: "tool_use", model: req.model, usage, costNanoUsd: costNanoUsd(req.model, usage), durationMs: 1, firstTokenMs: 1 };
      },
    };
    const done = await send("Change the opening hours");
    expect(done).toMatchObject({ type: "done", tooBig: true, charged: 1, credits: 9 });
    expect(done.type === "done" && done.message.status).toBe("failed");
    expect(await billing.creditsLeft("u")).toBe(9);
  });

  it("asks before a bigger change, charges nothing until confirmed, then charges its size", async () => {
    const { billing, deps, send, p } = await setup();
    expect(await send("Add a new page for our catering")).toEqual({ type: "needs_confirm", size: "medium", cost: 2, credits: 10 });
    expect(await billing.creditsLeft("u")).toBe(10);
    // Unconfirmed requests aren't saved in the chat.
    expect((await deps.store.listMessages("u", p)).filter((m) => m.role === "owner")).toHaveLength(1);
    const done = await send("Add a new page for our catering", "medium");
    expect(done).toMatchObject({ type: "done", charged: 2, size: "medium", credits: 8 });
    expect((await billing.store().ledger("u", 1, 0))[0]).toMatchObject({ reason: "ai_edit", delta: -2, size: "medium", note: "Add a new page for our catering" });
  });

  it("never trusts a smaller confirmed size than the server finds", async () => {
    const { billing, send } = await setup();
    expect(await send("Redesign the whole website", "medium")).toMatchObject({ type: "needs_confirm", size: "large", cost: 4 });
    expect(await send("Redesign the whole website", "large")).toMatchObject({ type: "done", charged: 4, credits: 6 });
    // A small request runs at once for one change, even if "large" was sent.
    expect(await send("Abol Cafe", "large")).toMatchObject({ type: "done", charged: 1, size: "small", credits: 5 });
    expect(await billing.creditsLeft("u")).toBe(5);
  });

  it("won't charge more than the owner has, and gives back all of a failed change", async () => {
    const { billing, send } = await setup();
    await billing.consumeEdit("u", "spent", 7);
    expect(await send("Redesign the whole website", "large")).toEqual({ type: "error", code: "no_credits", credits: 3, cost: 4 });
    expect(await billing.creditsLeft("u")).toBe(3);
    // "break it" with "a new page" is medium: charged 2, the build fails, 2 come back.
    const failed = await send("break it: add a new page", "medium");
    expect(failed).toMatchObject({ type: "done", charged: 0, credits: 3 });
    expect(failed.type === "done" && failed.message.status).toBe("failed");
  });
});

describe("free first build budget", () => {
  const starter = readFileSync("templates/site/src/site.json", "utf8");
  /** A model that keeps working (reads a file each turn) at 5,000 output tokens (US$0.10) a turn. */
  const busy = (requests: number[]): BuilderDeps["llm"] => ({
    complete: async (req) => {
      requests.push(req.maxTokens);
      const usage = { inputTokens: 0, outputTokens: 5000, cacheReadTokens: 0, cacheWriteTokens: 0 };
      return { content: [toolUseBlock("read_file", { path: "src/site.json" })], stopReason: "tool_use", model: req.model, usage, costNanoUsd: costNanoUsd(req.model, usage), durationMs: 1, firstTokenMs: 1 };
    },
  });
  async function spend(firstBuildCapCents: number) {
    const billing = new Billing(new MemoryBillingStore());
    const requests: number[] = [];
    const usage = new MemoryUsageLogger();
    const deps: BuilderDeps = {
      store: new MemoryProjectStore(),
      sandboxes: new MemorySandboxProvider({ "src/site.json": starter }),
      llm: busy(requests),
      usage,
      model: "claude-opus-5-5",
      lock: new MemoryLock(),
      credits: {
        consume: (u, r, n, meta) => billing.consumeEdit(u, r, n, meta),
        refund: (u, r, n, meta) => billing.refundEdit(u, r, n, meta),
        left: (u) => billing.creditsLeft(u),
        freeFirstBuild: (u, r) => billing.freeFirstBuild(u, r),
        pricing: async () => ({ sizeCredits: { small: 1, medium: 2, large: 4 }, capCentsPerCredit: 15, firstBuildCapCents }),
      },
    };
    const p = (await deps.store.createProject("u", { name: "", locale: "en" })).id;
    const events: BuilderEvent[] = [];
    await sendOwnerMessage(deps, { ownerId: "u", projectId: p, text: "Selam Coffee", onEvent: (e) => events.push(e) });
    const cost = usage.records.reduce((s, r) => s + r.costNanoUsd, 0);
    return { cost, turns: requests.length, done: events.at(-1), events, left: await billing.creditsLeft("u") };
  }

  it("uses the first-build cap from the admin settings, logs the cost and charges nothing", async () => {
    const small = await spend(30);
    const big = await spend(75);
    expect(small.turns).toBeLessThan(big.turns);
    expect(small.cost).toBeLessThanOrEqual(30 * 10_000_000 + 1024 * 20_000);
    expect(big.cost).toBeLessThanOrEqual(75 * 10_000_000 + 1024 * 20_000);
    expect(big.done).toMatchObject({ type: "done", charged: 0, tooBig: true });
    expect(big.left).toBe(10);
    // The model was told to finish before the cap stopped it.
    expect(big.events.some((e) => e.type === "wrap_up")).toBe(true);
  });

  it("never spends past the hard limit, whatever the setting says", async () => {
    const r = await spend(100_000);
    expect(r.cost).toBeLessThanOrEqual(MAX_FIRST_BUILD_CAP_CENTS * 10_000_000 + 1024 * 20_000);
  });
});
