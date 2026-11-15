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
      credits: { consume: (u, r) => billing.consumeEdit(u, r), refund: (u, r) => billing.refundEdit(u, r) },
    };
    const p = await deps.store.createProject("u", { name: "", locale: "en" });
    const send = async (text: string) => {
      const events: BuilderEvent[] = [];
      await sendOwnerMessage(deps, { ownerId: "u", projectId: p.id, text, onEvent: (e) => events.push(e) });
      return events.at(-1)!;
    };
    return { billing, send };
  }

  it("charges one credit per change and refunds failed changes", async () => {
    const { billing, send } = await setup();
    expect(await billing.creditsLeft("u")).toBe(15);
    expect((await send("Selam Cafe")).type).toBe("done");
    expect(await billing.creditsLeft("u")).toBe(14);
    const failed = await send("break it");
    expect(failed.type === "done" && failed.message.status).toBe("failed");
    expect(await billing.creditsLeft("u")).toBe(14);
  });

  it("stops when credits run out", async () => {
    const { billing, send } = await setup();
    for (let i = 0; i < 15; i++) await billing.consumeEdit("u", `pre-${i}`);
    expect(await send("Selam Cafe")).toEqual({ type: "error", code: "no_credits" });
  });
});
