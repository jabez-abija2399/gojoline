import { describe, expect, it } from "vitest";
import { readCapped, readJsonCapped } from "./body";

const streamed = (text: string, contentLength?: string) => new Request("http://x/", { method: "POST", body: new Blob([text]).stream(), duplex: "half", headers: contentLength ? { "content-length": contentLength } : {} } as RequestInit);

describe("readCapped", () => {
  it("reads up to the cap and refuses more, whatever Content-Length says", async () => {
    expect(await readCapped(streamed("hello"), 5)).toBe("hello");
    expect(await readCapped(streamed("hello!", "2"), 5)).toBeNull();
    expect(await readJsonCapped(streamed('{"a":1}'), 100)).toEqual({ tooLarge: false, value: { a: 1 } });
    expect(await readJsonCapped(streamed("nope"), 100)).toEqual({ tooLarge: false, value: null });
    expect(await readJsonCapped(streamed("x".repeat(101)), 100)).toEqual({ tooLarge: true });
  });
});
