import { describe, expect, it } from "vitest";
import { MemoryLock } from "@/lib/lock";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { VercelPublishProvider } from "@/lib/providers/publish/vercel";
import { VercelSandboxProvider } from "@/lib/providers/sandbox/vercel";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { isVersionedPath, templateFiles } from "@/lib/template/files";
import { publishSite } from "./service";

const env = process.env;
const enabled = env.RUN_LLM_TESTS === "1" && !!env.VERCEL_TOKEN && !!env.VERCEL_TEAM_ID && !!env.VERCEL_PROJECT_ID;

// Creates a real sandbox and a real Vercel deployment (one fixed test project, reused).
describe.skipIf(!enabled)("publish (live)", () => {
  it("builds the starter site in a sandbox and serves it publicly with strict headers", async () => {
    const store = new MemoryProjectStore();
    const project = await store.createProject("itest", { name: "Bole Buna House", locale: "en" });
    // A version is the full set of editable files, like the builder saves.
    const starter = Object.fromEntries(templateFiles().flatMap((f) => (isVersionedPath(f.path) && typeof f.content === "string" ? [[f.path, f.content]] : [])));
    await store.addVersion("itest", { projectId: project.id, summary: "starter", files: starter });
    const t0 = Date.now();
    const result = await publishSite(
      {
        store,
        sites: new MemorySiteStore(),
        sandboxes: new VercelSandboxProvider({ teamId: env.VERCEL_TEAM_ID!, projectId: env.VERCEL_PROJECT_ID!, token: env.VERCEL_TOKEN!, snapshotId: env.SANDBOX_SNAPSHOT_ID }),
        publisher: new VercelPublishProvider({ token: env.VERCEL_TOKEN!, teamId: env.VERCEL_TEAM_ID! }),
        lock: new MemoryLock(),
        appUrl: "https://gojoline.com",
      },
      { id: "itest", verified: true },
      project.id,
      "itest-starter",
    );
    console.log("publish", result, Date.now() - t0, "ms");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const res = await fetch(`${result.site.url}/menu`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain("Bole Buna House");
    expect(res.headers.get("content-security-policy")).toContain("script-src 'self'");
    expect(html).toContain(`<link rel="canonical" href="${result.site.url}/menu">`);
    const sitemap = await (await fetch(`${result.site.url}/sitemap.xml`)).text();
    expect(sitemap).toContain(`${result.site.url}/am/menu`);
  }, 300_000);
});
