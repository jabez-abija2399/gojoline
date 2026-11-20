import { describe, expect, it } from "vitest";
import { Billing } from "@/lib/billing/service";
import { MemoryBillingStore } from "@/lib/billing/store";
import { MemoryLock } from "@/lib/lock";
import { DemoLLMProvider } from "@/lib/providers/llm/demo";
import { BuildingPausedError, PausedSandboxProvider } from "@/lib/providers/sandbox/paused";
import { PausedPublishProvider } from "@/lib/providers/publish/paused";
import { MemoryUsageLogger } from "@/lib/providers/llm/usage-log";
import { publishSite } from "@/lib/publish/service";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { sendOwnerMessage, type BuilderDeps, type BuilderEvent } from "./service";

describe("building paused (no sandbox configured)", () => {
  async function setup() {
    const billing = new Billing(new MemoryBillingStore());
    const deps: BuilderDeps = {
      paused: true,
      store: new MemoryProjectStore(),
      sandboxes: new PausedSandboxProvider(),
      llm: new DemoLLMProvider(),
      usage: new MemoryUsageLogger(),
      model: "claude-opus-5-5",
      lock: new MemoryLock(),
      credits: { consume: (u, r) => billing.consumeEdit(u, r), refund: (u, r) => billing.refundEdit(u, r), freeFirstBuild: (u, r) => billing.freeFirstBuild(u, r) },
    };
    const project = await deps.store.createProject("u", { name: "Selam Cafe", locale: "en" });
    return { billing, deps, project };
  }

  it("answers 'paused' to a message, charges nothing and saves nothing", async () => {
    const { billing, deps, project } = await setup();
    const events: BuilderEvent[] = [];
    await sendOwnerMessage(deps, { ownerId: "u", projectId: project.id, text: "Make the title bigger", onEvent: (e) => events.push(e) });
    expect(events).toEqual([{ type: "error", code: "paused" }]);
    expect(await billing.creditsLeft("u")).toBe(10);
    expect(await deps.store.listMessages("u", project.id)).toEqual([]);
  });

  it("still says not_found for someone else's project", async () => {
    const { deps, project } = await setup();
    const events: BuilderEvent[] = [];
    await sendOwnerMessage(deps, { ownerId: "intruder", projectId: project.id, text: "hi", onEvent: (e) => events.push(e) });
    expect(events).toEqual([{ type: "error", code: "not_found" }]);
  });

  it("publishing answers 'paused' before building anything", async () => {
    const { deps, project } = await setup();
    const sites = new MemorySiteStore();
    const out = await publishSite({ store: deps.store, sandboxes: deps.sandboxes, lock: deps.lock, sites, publisher: new PausedPublishProvider("afridea.et"), appUrl: "https://x", paused: true }, { id: "u", verified: true }, project.id, "selam");
    expect(out).toEqual({ ok: false, error: "paused" });
    expect(await sites.getByProject("u", project.id)).toBeNull();
  });

  it("the paused providers refuse to build or publish", async () => {
    await expect(new PausedSandboxProvider().open()).rejects.toBeInstanceOf(BuildingPausedError);
    const p = new PausedPublishProvider("afridea.et");
    expect(p.urlFor("selam")).toBe("https://selam.afridea.et");
    expect(new URL(new PausedPublishProvider().urlFor("slug")).hostname).toBe("slug.invalid");
    await expect(p.publish()).rejects.toBeInstanceOf(BuildingPausedError);
  });
});
