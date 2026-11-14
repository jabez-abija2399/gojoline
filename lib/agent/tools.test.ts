import { describe, expect, it } from "vitest";
import { agentTools, runTool } from "./tools";
import { MemoryWorkspace, checkReadPath, checkWritePath } from "./workspace";

describe("path rules", () => {
  it.each(["src/site.ts", "src/sections/Hero.tsx", "src/styles.css", "public/images/a.webp"])("allows writing %s", (p) => {
    expect(checkWritePath(p).ok).toBe(true);
  });
  it.each(["package.json", "vite.config.ts", "../secrets", "/etc/passwd", "src/../package.json", "src/lib/schema.ts", "src/main.tsx", "scripts/prerender.mjs", "node_modules/x/index.js", "public/evil.js", ".env"])(
    "blocks writing %s",
    (p) => expect(checkWritePath(p).ok).toBe(false),
  );
  it("allows reading locked core files but not secrets", () => {
    expect(checkReadPath("src/lib/types.ts").ok).toBe(true);
    expect(checkReadPath("package.json").ok).toBe(true);
    expect(checkReadPath(".env").ok).toBe(false);
  });
});

describe("runTool", () => {
  const ws = () => new MemoryWorkspace({ "src/site.ts": "const a = 1;\nconst b = 1;\n" });

  it("exposes JSON schemas without $schema", () => {
    expect(agentTools.map((t) => t.name)).toEqual(["list_files", "read_file", "write_file", "search_replace", "run_build"]);
    expect(JSON.stringify(agentTools)).not.toContain("$schema");
  });

  it("rejects invalid input instead of throwing", async () => {
    expect((await runTool("write_file", { path: "src/x.ts" }, ws())).isError).toBe(true);
    expect((await runTool("nope", {}, ws())).isError).toBe(true);
    expect((await runTool("read_file", { path: "src/site.ts", extra: 1 }, ws())).isError).toBe(true);
  });

  it("search_replace needs exactly one match", async () => {
    const w = ws();
    expect((await runTool("search_replace", { path: "src/site.ts", old_string: "= 1;", new_string: "= 2;" }, w)).content).toContain("2 times");
    expect((await runTool("search_replace", { path: "src/site.ts", old_string: "zzz", new_string: "" }, w)).content).toContain("not found");
    const ok = await runTool("search_replace", { path: "src/site.ts", old_string: "const a = 1;", new_string: "const a = '$&';" }, w);
    expect(ok.changedPath).toBe("src/site.ts");
    // `$&` must be inserted literally, not as a regex replacement pattern.
    expect(await w.readFile("src/site.ts")).toContain("const a = '$&';");
  });

  it("write_file refuses locked paths", async () => {
    const out = await runTool("write_file", { path: "package.json", content: "{}" }, ws());
    expect(out.isError).toBe(true);
  });
});
