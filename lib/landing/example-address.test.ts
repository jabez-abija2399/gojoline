import { describe, expect, it } from "vitest";
import { exampleHost } from "./example-address";

const vercel = { name: "vercel", urlFor: (s: string) => `https://gojo-${s}.vercel.app` };
const memory = { name: "memory", urlFor: (s: string) => `https://${s}.sites.example` };

describe("example address", () => {
  it("uses our own publishing domain when it is configured", () => {
    expect(exampleHost("bole-buna-house", { PUBLISH_BASE_DOMAIN: "gojoline.site" }, vercel)).toBe("bole-buna-house.gojoline.site");
    expect(exampleHost("bole-buna-house", { PUBLISH_BASE_DOMAIN: " Gojoline.Site " }, null)).toBe("bole-buna-house.gojoline.site");
  });

  it("never guesses an address on a shared host", () => {
    expect(exampleHost("bole-buna-house", {}, vercel)).toBeNull();
    expect(exampleHost("bole-buna-house", {}, null)).toBeNull();
    expect(exampleHost("bole-buna-house", { PUBLISH_BASE_DOMAIN: "not a domain/" }, vercel)).toBeNull();
  });

  it("uses the test stand-in's example domain", () => {
    expect(exampleHost("bole-buna-house", {}, memory)).toBe("bole-buna-house.sites.example");
  });
});
