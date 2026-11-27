import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { newCertificates, parseArgs, parseEnv, run, toRun, type Item, type Options } from "./republish-all.mts";

const item = (slug: string, action: Item["action"]): Item => ({ siteId: `id-${slug}`, slug, from: "vercel", url: `https://gojo-${slug}.vercel.app`, action, note: "", offline: false });
const items = [item("bole-cafe", "republish"), item("done-site", "skip"), item("bad-site", "notice")];
const opts = (o: Partial<Options> = {}): Options => ({ appUrl: "https://app.test", secret: "s", dryRun: false, mode: "move", delayMs: 30_000, ...o });

function fakeApp(list: Item[] = items, busy: number[] = [], wildcardTls = false) {
  const calls: { method: string; url: string; body?: string; auth: string | null }[] = [];
  const impl = (async (url: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({ method: init?.method ?? "GET", url: String(url), body: init?.body as string | undefined, auth: headers.get("authorization") });
    if (String(url).endsWith("status=1")) return Response.json({ workspaces: { running: busy.shift() ?? 0, max: 2 } });
    if ((init?.method ?? "GET") === "GET") return Response.json({ host: "server", paused: false, wildcardTls, items: list });
    const { siteId } = JSON.parse(String(init!.body)) as { siteId: string };
    return Response.json(siteId === "id-bad-site" ? { result: { ok: false, error: "failed" } } : { result: { ok: true, url: "https://bole-cafe.afridea.et", note: "published" } });
  }) as typeof fetch;
  return { calls, impl };
}

describe("republish-all", () => {
  it("reads the server's .env and the flags", async () => {
    const dir = await mkdtemp(join(tmpdir(), "env-"));
    await writeFile(join(dir, ".env"), "# comment\nAPP_DOMAIN=gojoline.afridea.et\nCRON_SECRET=s3cret\n");
    expect(parseArgs(["--env", join(dir, ".env"), "--dry-run"], {})).toEqual({ appUrl: "https://gojoline.afridea.et", secret: "s3cret", dryRun: true, mode: "move", only: undefined, limit: undefined, delayMs: 30_000 });
    expect(parseArgs(["--forward-old", "--only", "bole-cafe", "--limit", "5", "--delay", "0"], { APP_URL: "http://localhost:3000/", CRON_SECRET: "x" })).toMatchObject({ appUrl: "http://localhost:3000", mode: "forward", only: "bole-cafe", dryRun: false, limit: 5, delayMs: 0 });
    expect(typeof parseArgs([], {})).toBe("string");
    expect(typeof parseArgs(["--limit", "x"], { APP_URL: "http://a", CRON_SECRET: "x" })).toBe("string");
    expect(parseEnv("A=1\r\nB = no\nC=x=y")).toEqual({ A: "1", C: "x=y" });
    await rm(dir, { recursive: true });
  });

  it("selects only sites with something to do, in batches", () => {
    expect(toRun(items).map((i) => i.slug)).toEqual(["bole-cafe", "bad-site"]);
    expect(toRun(items, "bad-site").map((i) => i.slug)).toEqual(["bad-site"]);
    expect(toRun(items, undefined, 1).map((i) => i.slug)).toEqual(["bole-cafe"]);
    expect(newCertificates(items)).toBe(2);
  });

  it("a dry run lists and changes nothing", async () => {
    const app = fakeApp();
    const lines: string[] = [];
    expect(await run(opts({ dryRun: true }), app.impl, (l) => lines.push(l))).toBe(0);
    expect(app.calls.map((c) => c.method)).toEqual(["GET"]);
    expect(app.calls[0]).toMatchObject({ url: "https://app.test/api/cron/republish?mode=move", auth: "Bearer s" });
    expect(lines.join("\n")).toMatch(/would\s+bole-cafe/);
    expect(lines.at(-1)).toBe("Dry run: 2 site(s) would change. Nothing was changed.");
  });

  it("warns when the run would need too many new certificates without the wildcard", async () => {
    const many = Array.from({ length: 40 }, (_, n) => item(`site-${n}`, "republish"));
    const lines: string[] = [];
    await run(opts({ dryRun: true }), fakeApp(many).impl, (l) => lines.push(l));
    expect(lines.some((l) => l.startsWith("WARNING: 40 sites"))).toBe(true);
    const quiet: string[] = [];
    await run(opts({ dryRun: true }), fakeApp(many, [], true).impl, (l) => quiet.push(l));
    expect(quiet.some((l) => l.startsWith("WARNING"))).toBe(false);
  });

  it("runs one request per site with a pause between, logs each and fails when any site failed", async () => {
    const app = fakeApp();
    const lines: string[] = [];
    const sleeps: number[] = [];
    expect(await run(opts(), app.impl, (l) => lines.push(l), async (ms) => sleeps.push(ms))).toBe(1);
    expect(app.calls.filter((c) => c.method === "POST").map((c) => JSON.parse(c.body!).siteId)).toEqual(["id-bole-cafe", "id-bad-site"]);
    expect(sleeps).toEqual([30_000]);
    expect(lines.some((l) => /^ok\s+bole-cafe.*→ https:\/\/bole-cafe\.afridea\.et/.test(l))).toBe(true);
    expect(lines.some((l) => /^FAILED\s+bad-site\s+failed/.test(l))).toBe(true);
  });

  it("waits while builders use every workspace, and leaves a site for later when they stay busy", async () => {
    const app = fakeApp([item("bole-cafe", "republish")], [2, 2, 1]);
    const lines: string[] = [];
    const sleeps: number[] = [];
    expect(await run(opts(), app.impl, (l) => lines.push(l), async (ms) => sleeps.push(ms))).toBe(0);
    expect(sleeps).toEqual([30_000, 30_000]);
    expect(lines.some((l) => l.startsWith("wait"))).toBe(true);

    const stuck = fakeApp([item("bole-cafe", "republish")], Array(100).fill(2));
    const out: string[] = [];
    expect(await run(opts(), stuck.impl, (l) => out.push(l), async () => undefined)).toBe(1);
    expect(stuck.calls.some((c) => c.method === "POST")).toBe(false);
    expect(out.some((l) => l.startsWith("later"))).toBe(true);
  });
});
