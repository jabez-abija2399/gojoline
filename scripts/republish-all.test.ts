import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseArgs, parseEnv, run, toRun, type Item } from "./republish-all.mts";

const item = (slug: string, action: Item["action"]): Item => ({ siteId: `id-${slug}`, slug, from: "vercel", url: `https://gojo-${slug}.vercel.app`, action, note: "", offline: false });
const items = [item("bole-cafe", "republish"), item("done-site", "skip"), item("bad-site", "notice")];

function fakeApp() {
  const calls: { method: string; url: string; body?: string; auth: string | null }[] = [];
  const impl = (async (url: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ method: init?.method ?? "GET", url: String(url), body: init?.body as string | undefined, auth: headers.get("authorization") });
    if ((init?.method ?? "GET") === "GET") return Response.json({ host: "server", paused: false, items });
    const { siteId } = JSON.parse(String(init!.body)) as { siteId: string };
    return Response.json(siteId === "id-bad-site" ? { result: { ok: false, error: "failed" } } : { result: { ok: true, url: "https://bole-cafe.afridea.et", note: "published" } });
  }) as typeof fetch;
  return { calls, impl };
}

describe("republish-all", () => {
  it("reads the server's .env and the flags", async () => {
    const dir = await mkdtemp(join(tmpdir(), "env-"));
    await writeFile(join(dir, ".env"), "# comment\nAPP_DOMAIN=gojoline.afridea.et\nCRON_SECRET=s3cret\n");
    expect(parseArgs(["--env", join(dir, ".env"), "--dry-run"], {})).toEqual({ appUrl: "https://gojoline.afridea.et", secret: "s3cret", dryRun: true, mode: "move", only: undefined });
    expect(parseArgs(["--forward-old", "--only", "bole-cafe"], { APP_URL: "http://localhost:3000/", CRON_SECRET: "x" })).toMatchObject({ appUrl: "http://localhost:3000", mode: "forward", only: "bole-cafe", dryRun: false });
    expect(typeof parseArgs([], {})).toBe("string");
    expect(parseEnv("A=1\r\nB = no\nC=x=y")).toEqual({ A: "1", C: "x=y" });
    await rm(dir, { recursive: true });
  });

  it("selects only sites with something to do", () => {
    expect(toRun(items).map((i) => i.slug)).toEqual(["bole-cafe", "bad-site"]);
    expect(toRun(items, "bad-site").map((i) => i.slug)).toEqual(["bad-site"]);
  });

  it("a dry run lists and changes nothing", async () => {
    const app = fakeApp();
    const lines: string[] = [];
    expect(await run({ appUrl: "https://app.test", secret: "s", dryRun: true, mode: "move" }, app.impl, (l) => lines.push(l))).toBe(0);
    expect(app.calls.map((c) => c.method)).toEqual(["GET"]);
    expect(app.calls[0]).toMatchObject({ url: "https://app.test/api/cron/republish?mode=move", auth: "Bearer s" });
    expect(lines.join("\n")).toMatch(/would\s+bole-cafe/);
    expect(lines.at(-1)).toBe("Dry run: 2 site(s) would change. Nothing was changed.");
  });

  it("runs one request per site, logs each and fails when any site failed", async () => {
    const app = fakeApp();
    const lines: string[] = [];
    expect(await run({ appUrl: "https://app.test", secret: "s", dryRun: false, mode: "move" }, app.impl, (l) => lines.push(l))).toBe(1);
    expect(app.calls.filter((c) => c.method === "POST").map((c) => JSON.parse(c.body!).siteId)).toEqual(["id-bole-cafe", "id-bad-site"]);
    expect(lines.some((l) => /^ok\s+bole-cafe.*→ https:\/\/bole-cafe\.afridea\.et/.test(l))).toBe(true);
    expect(lines.some((l) => /^FAILED\s+bad-site\s+failed/.test(l))).toBe(true);
  });
});
