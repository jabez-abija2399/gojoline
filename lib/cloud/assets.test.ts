import { describe, expect, it } from "vitest";
import { PLAN_FEATURES } from "@/lib/billing/plans";
import { MAX_ASSETS_PER_PROJECT, photoQuota } from "./assets";

describe("photo storage per plan", () => {
  const MB = 1024 * 1024;
  it("refuses only the new upload that would go over the plan's space", () => {
    const free = PLAN_FEATURES.free.storageBytes;
    expect(photoQuota({ count: 3, usedBytes: 49 * MB, newBytes: MB / 2, limitBytes: free })).toBe("ok");
    expect(photoQuota({ count: 3, usedBytes: 49.8 * MB, newBytes: MB / 2, limitBytes: free })).toBe("storage_full");
    // An owner already over a smaller limit (e.g. after leaving a paid plan) keeps their photos; only new ones wait.
    expect(photoQuota({ count: 3, usedBytes: 400 * MB, newBytes: MB, limitBytes: free })).toBe("storage_full");
    expect(photoQuota({ count: 3, usedBytes: 400 * MB, newBytes: MB, limitBytes: PLAN_FEATURES.starter.storageBytes })).toBe("ok");
    expect(photoQuota({ count: MAX_ASSETS_PER_PROJECT, usedBytes: 0, newBytes: MB, limitBytes: free })).toBe("too_many_photos");
  });

  it("gives Free 50 MB, Starter 500 MB and Business 2 GB", () => {
    expect([PLAN_FEATURES.free, PLAN_FEATURES.starter, PLAN_FEATURES.business].map((p) => p.storageBytes / MB)).toEqual([50, 500, 2048]);
  });
});
