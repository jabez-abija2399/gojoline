import { describe, expect, it } from "vitest";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { noticeTargets } from "./hosts";

describe("noticeTargets", () => {
  const server = Object.assign(new MemoryPublishProvider(), { name: "server" });
  const moved = { slug: "bole-cafe", provider: "server", providerProjectId: "srv:bole-cafe", legacyProjectId: "prj_1" };

  it("still reaches the live host when the old host isn't configured (and says so)", () => {
    expect(() => noticeTargets(moved, server, null)).toThrow("no_host:legacy");
    const missing: string[] = [];
    expect(noticeTargets(moved, server, null, { missing })).toEqual([{ host: server, projectId: "srv:bole-cafe" }]);
    expect(missing).toEqual(["legacy"]);
  });

  it("derives the server's ID for a takedown during a first publish", () => {
    const site = { slug: "bole-cafe", provider: "server", providerProjectId: null };
    expect(noticeTargets(site, server, null, { includeCurrent: true })).toEqual([{ host: server, projectId: "srv:bole-cafe" }]);
  });
});
