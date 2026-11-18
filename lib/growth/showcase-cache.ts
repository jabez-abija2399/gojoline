import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { services } from "@/lib/server/services";
import type { ShowcaseEntry } from "./showcase";

export const SHOWCASE_LIMIT = 60;
const TAG = "showcase";

/** The public list, cached 10 minutes and refreshed at once on opt-in, hide, publish, takedown or rest. */
const cached = unstable_cache(async (): Promise<ShowcaseEntry[]> => (await services().growth.showcase?.list(SHOWCASE_LIMIT)) ?? [], ["showcase-list-v1"], { revalidate: 600, tags: [TAG] });

export function showcaseList(): Promise<ShowcaseEntry[]> {
  return cached();
}

/** Something listed may have changed: the next visit reads fresh. */
export function invalidateShowcase(): void {
  try {
    revalidateTag(TAG, { expire: 0 });
  } catch {
    // Outside a request (tests, scripts) there is no cache to refresh.
  }
}
