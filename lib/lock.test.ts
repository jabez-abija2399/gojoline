import { describe, expect, it } from "vitest";
import { MemoryLock } from "./lock";

describe("MemoryLock", () => {
  it("lets one holder in and only the holder release", async () => {
    const lock = new MemoryLock();
    const a = await lock.acquire("p1", 10_000);
    expect(a).toBeTruthy();
    expect(await lock.acquire("p1", 10_000)).toBeNull();
    await lock.release("p1", "wrong-token");
    expect(await lock.acquire("p1", 10_000)).toBeNull();
    await lock.release("p1", a!);
    expect(await lock.acquire("p1", 10_000)).toBeTruthy();
  });
  it("expires", async () => {
    const lock = new MemoryLock();
    await lock.acquire("p2", 1);
    await new Promise((r) => setTimeout(r, 5));
    expect(await lock.acquire("p2", 1000)).toBeTruthy();
  });
});
