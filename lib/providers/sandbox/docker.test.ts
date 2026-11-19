import { describe, expect, it } from "vitest";
import { DockerSandboxProvider } from "./docker";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

/** A pretend runner: a file system per project, `npm run build` writes dist/, the dev server is up after one ping. */
function fakeRunner(opts: { host?: string; buildOk?: boolean } = {}) {
  const files = new Map<string, Buffer>();
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  let pings = 0;
  const reply = (v: unknown) => new Response(JSON.stringify(v), { status: 200 });
  const fetchFn = (async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer s3cret-s3cret-s3cret-s3cret");
    calls.push({ path, body });
    if (path === "/open") return reply({ name: `gojo-${ID}`, fresh: true, previewHost: opts.host ?? `gojo-${ID}.preview.afridea.et` });
    if (path === "/write") {
      for (const f of body.files as { path: string; data: string }[]) files.set(f.path, Buffer.from(f.data, "base64"));
      return reply({ ok: true });
    }
    if (path === "/read") {
      const f = files.get(String(body.path));
      return reply({ data: f ? f.toString("base64") : null });
    }
    if (path === "/exec") {
      const cmd = body.cmd as string[];
      if (cmd[0] === "node") return reply({ exitCode: pings++ > 0 ? 0 : 1, stdout: "", stderr: "" });
      if (cmd[0] === "find") return reply({ exitCode: 0, stdout: [...files.keys()].filter((p) => cmd.slice(1, -2).some((d) => p.startsWith(`${d}/`))).join("\n"), stderr: "" });
      if (cmd[0] === "rm") {
        for (const p of cmd.slice(3)) files.delete(p);
        return reply({ exitCode: 0, stdout: "", stderr: "" });
      }
      if (cmd[0] === "npm") {
        if (opts.buildOk === false) return reply({ exitCode: 1, stdout: "", stderr: "site.json: hero.title is required" });
        files.set("dist/index.html", Buffer.from("<html>built</html>"));
        return reply({ exitCode: 0, stdout: "built", stderr: "" });
      }
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  return { fetchFn, files, calls };
}

describe("DockerSandboxProvider (through the runner)", () => {
  const config = (fetchFn: typeof fetch) => ({ url: "http://runner:7070/", secret: "s3cret-s3cret-s3cret-s3cret", fetch: fetchFn });

  it("opens, restores the saved version, waits for the preview and gives its own HTTPS origin", async () => {
    const r = fakeRunner();
    r.files.set("src/old.json", Buffer.from("{}"));
    const site = await new DockerSandboxProvider(config(r.fetchFn)).open(ID, { "src/site.json": '{"name":"Selam"}' });
    expect(site.previewUrl).toBe(`https://gojo-${ID}.preview.afridea.et`);
    expect(await site.readFile("src/site.json")).toBe('{"name":"Selam"}');
    expect(r.calls[0]).toEqual({ path: "/open", body: { project: ID } });
    expect(r.calls.filter((c) => c.path === "/exec" && (c.body.cmd as string[])[0] === "node").length).toBe(2);
  });

  it("refuses a preview host that isn't a workspace's own", async () => {
    const r = fakeRunner({ host: "gojoline.afridea.et" });
    await expect(new DockerSandboxProvider(config(r.fetchFn)).open(ID, null)).rejects.toThrow("Unexpected preview host");
  });

  it("puts locked template files back before building, and returns the build's files for publishing", async () => {
    const r = fakeRunner();
    const site = await new DockerSandboxProvider(config(r.fetchFn)).open(ID, null);
    const built = await site.buildForPublish({ VITE_DATA_API: "https://gojoline.afridea.et" });
    expect(built.ok).toBe(true);
    expect(built.files).toEqual([{ path: "index.html", data: Buffer.from("<html>built</html>") }]);
    const npm = r.calls.find((c) => c.path === "/exec" && (c.body.cmd as string[])[0] === "npm")!;
    expect(npm.body.env).toEqual({ VITE_DATA_API: "https://gojoline.afridea.et" });
    const lockedWrite = r.calls.findIndex((c) => c.path === "/write");
    expect(lockedWrite).toBeGreaterThanOrEqual(0);
    expect(lockedWrite).toBeLessThan(r.calls.indexOf(npm));
    expect(r.files.has("package.json")).toBe(true);
  });

  it("reports a failed check build with its errors for the agent", async () => {
    const r = fakeRunner({ buildOk: false });
    const site = await new DockerSandboxProvider(config(r.fetchFn)).open(ID, null);
    const res = await site.runBuild();
    expect(res.ok).toBe(false);
    expect(res.output).toContain("hero.title is required");
  });

  it("writes only owner photos as assets", async () => {
    const r = fakeRunner();
    const site = await new DockerSandboxProvider(config(r.fetchFn)).open(ID, null);
    await site.writeAssets([{ path: "public/images/a.webp", data: Buffer.from([1]) }, { path: "src/evil.ts", data: Buffer.from("x") }]);
    expect(r.files.has("public/images/a.webp")).toBe(true);
    expect(r.files.has("src/evil.ts")).toBe(false);
  });
});
