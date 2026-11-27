import type { EventRow } from "@/lib/analytics/store";
import type { PostSignups } from "@/lib/growth/sources";

/** Networks a post link can name (utm_source on post links; Instagram shares "facebook", YouTube "other"). */
export const VISIT_SOURCES = ["telegram", "facebook", "tiktok", "other"] as const;
export type VisitSource = (typeof VISIT_SOURCES)[number];

const CAMPAIGN = /^post-\d{4}-\d{2}-\d{2}$/;

/** One of VISIT_SOURCES ("Telegram" → "telegram"; anything unknown → "other"), for visits and sign-ups alike. */
export function visitSource(source: unknown): VisitSource {
  const s = String(source ?? "").toLowerCase();
  return (VISIT_SOURCES as readonly string[]).includes(s) ? (s as VisitSource) : "other";
}

/** How far back a post's link still counts visits (days). */
export const VISIT_WINDOW_DAYS = 45;

/**
 * The counted key for a visit from a post link ("post-2026-11-23|telegram"), or null for anything
 * else: only real calendar days from the last VISIT_WINDOW_DAYS up to today (Addis), so made-up
 * dates can't create endless keys.
 */
export function postVisitKey(campaign: unknown, source: unknown, today: string): string | null {
  if (typeof campaign !== "string" || !CAMPAIGN.test(campaign)) return null;
  const day = campaign.slice(5);
  const t = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== day) return null;
  const age = (Date.parse(`${today}T00:00:00Z`) - t) / 86_400_000;
  if (age < 0 || age > VISIT_WINDOW_DAYS) return null;
  return `${campaign}|${visitSource(source)}`;
}

export interface PostResult {
  visits: number;
  signups: number;
  paid: number;
}

export interface Results {
  /** Per post day (YYYY-MM-DD). */
  byDay: Map<string, PostResult>;
  /** Per network, for the period. */
  byNetwork: Map<string, PostResult>;
  total: PostResult;
}

const empty = (): PostResult => ({ visits: 0, signups: 0, paid: 0 });

/** Visits (daily counts of post_visit) and sign-ups/payments from post links, per post and per network. */
export function summarize(visitRows: EventRow[], signups: PostSignups[]): Results {
  const byDay = new Map<string, PostResult>();
  const byNetwork = new Map<string, PostResult>();
  const total = empty();
  const add = (campaign: string, source: string, d: Partial<PostResult>) => {
    if (!CAMPAIGN.test(campaign)) return;
    const day = campaign.slice(5);
    for (const [map, key] of [[byDay, day], [byNetwork, source]] as const) {
      const r = map.get(key) ?? empty();
      r.visits += d.visits ?? 0;
      r.signups += d.signups ?? 0;
      r.paid += d.paid ?? 0;
      map.set(key, r);
    }
    total.visits += d.visits ?? 0;
    total.signups += d.signups ?? 0;
    total.paid += d.paid ?? 0;
  };
  for (const r of visitRows) {
    if (r.event !== "post_visit") continue;
    const [campaign, source = "other"] = r.key.split("|");
    add(campaign, visitSource(source), { visits: r.n });
  }
  for (const s of signups) add(s.campaign, visitSource(s.source), { signups: s.signups, paid: s.paid });
  return { byDay, byNetwork, total };
}
