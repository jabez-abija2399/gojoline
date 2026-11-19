import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { containerName, execArgs, previewHostName, runArgs, safeSitePath, tarFiles, toStop } from "./lib.ts";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("sandbox runner helpers", () => {
  it("names only project UUIDs", () => {
    expect(containerName(ID)).toBe(`gojo-${ID}`);
    expect(containerName(ID.toUpperCase())).toBe(`gojo-${ID}`);
    for (const bad of ["", "app", "../x", `${ID};rm`, "gojo-app", "x".repeat(36)]) expect(containerName(bad)).toBeNull();
  });

  it("accepts only plain relative paths inside the site", () => {
    expect(safeSitePath("src/site.json")).toBe("src/site.json");
    expect(safeSitePath("./public/images/a-1.webp")).toBe("public/images/a-1.webp");
    for (const bad of ["/etc/passwd", "../x", "src/../../x", "src//a", "a\0b", "src/$(id)", "", 5, "a b"]) expect(safeSitePath(bad)).toBeNull();
  });

  it("starts workspaces with fixed hardening flags and nothing from the caller", () => {
    const args = runArgs(`gojo-${ID}`, "gojoline-sandbox", "gojoline-previews", { memory: "768m", cpus: "1", pids: 512 });
    for (const f of ["--rm", "--cap-drop", "no-new-privileges", "--pids-limit", "--memory-swap"]) expect(args).toContain(f);
    expect(args.slice(args.indexOf("--user"), args.indexOf("--user") + 2)).toEqual(["--user", "node"]);
    expect(args).not.toContain("--privileged");
    expect(args.some((a) => a.includes("docker.sock") || a === "-v" || a === "--volume")).toBe(false);
    expect(args.at(-1)).toBe("gojoline-sandbox");
  });

  it("runs only allowed commands, as node, with a timeout and VITE_ variables only", () => {
    expect(execArgs("gojo-x", ["npm", "run", "build"], { timeoutS: 300, env: { VITE_DATA_API: "https://a" } })).toEqual(["exec", "-u", "node", "-w", "/site", "-e", "VITE_DATA_API=https://a", "gojo-x", "timeout", "-k", "5", "300", "npm", "run", "build"]);
    expect(execArgs("gojo-x", ["sh", "-c", "id"], { timeoutS: 5 })).toBeNull();
    expect(execArgs("gojo-x", ["bash"], { timeoutS: 5 })).toBeNull();
    expect(execArgs("gojo-x", ["npm"], { timeoutS: 5, env: { PATH: "/tmp" } })).toBeNull();
    expect(execArgs("gojo-x", ["npm"], { timeoutS: 5, cwd: "../" })).toBeNull();
    expect(execArgs("gojo-x", [], { timeoutS: 5 })).toBeNull();
  });

  it("writes a tar that GNU tar extracts byte for byte, with nested folders", () => {
    const dir = mkdtempSync(join(tmpdir(), "tar-"));
    const long = `src/${"deep/".repeat(22)}file.ts`;
    const bin = Buffer.from([0, 1, 2, 255, 254]);
    writeFileSync(join(dir, "a.tar"), tarFiles([{ path: "src/site.json", data: Buffer.from('{"a":1}') }, { path: "public/images/x.webp", data: bin }, { path: long, data: Buffer.from("ok") }]));
    execFileSync("tar", ["-x", "-f", "a.tar"], { cwd: dir });
    expect(readFileSync(join(dir, "src/site.json"), "utf8")).toBe('{"a":1}');
    expect(readFileSync(join(dir, "public/images/x.webp"))).toEqual(bin);
    expect(readFileSync(join(dir, long), "utf8")).toBe("ok");
  });

  it("stops idle workspaces and the least recently used beyond the limit, never the one being opened", () => {
    const now = 1_000_000;
    const used = new Map([["a", now - 20 * 60_000], ["b", now - 1000], ["c", now - 2000], ["d", now - 3000], ["e", now]]);
    expect(toStop(used, now, 15 * 60_000, 3, "e").sort()).toEqual(["a", "d"]);
    expect(toStop(used, now, 15 * 60_000, 1, "d").sort()).toEqual(["a", "b", "c", "e"]);
  });

  it("lets Caddy certify only workspace preview hosts", () => {
    expect(previewHostName(`gojo-${ID}.preview.afridea.et`, "afridea.et")).toBe(`gojo-${ID}`);
    for (const bad of ["gojoline.afridea.et", `app.preview.afridea.et`, `gojo-${ID}.preview.evil.et`, `x.gojo-${ID}.preview.afridea.et`]) expect(previewHostName(bad, "afridea.et")).toBeNull();
  });
});
