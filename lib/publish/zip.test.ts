import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { crc32, createZip } from "./zip";

describe("crc32", () => {
  it("matches the standard check value", () => {
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
  });
});

const hasUnzip = (() => {
  try {
    execFileSync("unzip", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe("createZip", () => {
  it.skipIf(!hasUnzip)("makes an archive unzip can read back exactly, text deflated and random bytes stored", () => {
    const html = Buffer.from("<!doctype html><title>ሰላም</title>" + "<p>Selam Coffee</p>".repeat(200));
    const photo = randomBytes(5000);
    const dir = mkdtempSync(join(tmpdir(), "zip-"));
    const file = join(dir, "site.zip");
    writeFileSync(file, createZip([{ path: "index.html", data: html }, { path: "images/ቡና.webp", data: photo }]));
    execFileSync("unzip", ["-q", "-t", file]);
    execFileSync("unzip", ["-q", file, "-d", join(dir, "out")]);
    expect(readFileSync(join(dir, "out", "index.html")).equals(html)).toBe(true);
    expect(readFileSync(join(dir, "out", "images", "ቡና.webp")).equals(photo)).toBe(true);
  });

  it("refuses paths that could escape the folder, and duplicates", () => {
    const data = Buffer.from("x");
    for (const path of ["/etc/passwd", "../a", "a/../../b", "a\\b", ""]) expect(() => createZip([{ path, data }])).toThrow();
    expect(() => createZip([{ path: "a", data }, { path: "a", data }])).toThrow();
  });
});
