import { randomBytes } from "node:crypto";
import type { Redis } from "@upstash/redis";
import { DEVICES, SOURCES, type Device, type Source } from "./classify";

export interface DayCounts {
  views: number;
  /** People (approximate in Redis: HyperLogLog). */
  visitors: number;
  /** Per person, counted on their first visit of the day. */
  referrers: Partial<Record<Source, number>>;
  devices: Partial<Record<Device, number>>;
}

/**
 * Live visit counts per site per Addis Ababa day. Redis in production; memory in development
 * and e2e (like the rate limiter and the lock). Keys expire after 3 days: the daily rollup
 * (lib/visits/stats.ts) copies them into Postgres before that.
 */
export interface VisitCounter {
  /** The day's random salt (kept only here, expires after 25 hours). */
  salt(day: string): Promise<string>;
  /**
   * One view. `ip` (a hash) caps how many different people one address can add per site per
   * day (`maxPerIp`): past it, its views still count but no new people.
   */
  record(siteId: string, day: string, visitorId: string, meta: { source: Source; device: Device; ip: string; maxPerIp: number }): Promise<void>;
  /** Several days at once (one round trip in Redis). */
  days(siteId: string, days: string[]): Promise<(DayCounts | null)[]>;
  /** Null when nothing was counted that day (or the counts have expired). */
  day(siteId: string, day: string): Promise<DayCounts | null>;
  /** Sites with visits that day (for the rollup). */
  sitesOn(day: string): Promise<string[]>;
}

export const KEEP_SECONDS = 3 * 86_400;
export const SALT_SECONDS = 25 * 3_600;

const pick = <K extends string>(keys: readonly K[], v: Record<string, unknown> | null | undefined): Partial<Record<K, number>> => {
  const out: Partial<Record<K, number>> = {};
  for (const k of keys) {
    const n = Number(v?.[k] ?? 0);
    if (n > 0) out[k] = n;
  }
  return out;
};

export class MemoryVisitCounter implements VisitCounter {
  private salts = new Map<string, { value: string; until: number }>();
  private store = new Map<string, { until: number; ids: Set<string>; byIp: Map<string, Set<string>>; views: number; referrers: Record<string, number>; devices: Record<string, number> }>();
  constructor(private now: () => number = Date.now) {}

  async salt(day: string) {
    const cur = this.salts.get(day);
    if (cur && cur.until > this.now()) return cur.value;
    const value = randomBytes(32).toString("hex");
    this.salts.set(day, { value, until: this.now() + SALT_SECONDS * 1000 });
    return value;
  }
  private live(key: string) {
    const d = this.store.get(key);
    return d && d.until > this.now() ? d : null;
  }
  async record(siteId: string, day: string, visitorId: string, meta: { source: Source; device: Device; ip: string; maxPerIp: number }) {
    const key = `${siteId}:${day}`;
    const d = this.live(key) ?? { until: 0, ids: new Set<string>(), byIp: new Map<string, Set<string>>(), views: 0, referrers: {}, devices: {} };
    d.until = this.now() + KEEP_SECONDS * 1000;
    d.views++;
    const fromIp = d.byIp.get(meta.ip) ?? new Set<string>();
    d.byIp.set(meta.ip, fromIp);
    const allowed = fromIp.has(visitorId) || fromIp.size < meta.maxPerIp;
    if (allowed) fromIp.add(visitorId);
    if (allowed && !d.ids.has(visitorId)) {
      d.ids.add(visitorId);
      d.referrers[meta.source] = (d.referrers[meta.source] ?? 0) + 1;
      d.devices[meta.device] = (d.devices[meta.device] ?? 0) + 1;
    }
    this.store.set(key, d);
  }
  async day(siteId: string, day: string): Promise<DayCounts | null> {
    const d = this.live(`${siteId}:${day}`);
    return d ? { views: d.views, visitors: d.ids.size, referrers: pick(SOURCES, d.referrers), devices: pick(DEVICES, d.devices) } : null;
  }
  async days(siteId: string, days: string[]) {
    return Promise.all(days.map((d) => this.day(siteId, d)));
  }
  async sitesOn(day: string) {
    return [...this.store.keys()].filter((k) => k.endsWith(`:${day}`) && this.live(k)).map((k) => k.slice(0, -(day.length + 1)));
  }
}

export class RedisVisitCounter implements VisitCounter {
  /** The salt is read from Redis once per day per server (it never changes during its day). */
  private cached = new Map<string, { value: string; until: number }>();
  constructor(private redis: Redis) {}

  async salt(day: string) {
    const hit = this.cached.get(day);
    if (hit && hit.until > Date.now()) return hit.value;
    const key = `gojo:v:salt:${day}`;
    // First server of the day makes it; everyone else reads the same one.
    await this.redis.set(key, randomBytes(32).toString("hex"), { nx: true, ex: SALT_SECONDS });
    const value = (await this.redis.get<string>(key)) ?? "";
    if (!value) throw new Error("visit salt missing");
    this.cached.clear();
    this.cached.set(day, { value, until: Date.now() + 10 * 60_000 });
    return value;
  }
  async record(siteId: string, day: string, visitorId: string, meta: { source: Source; device: Device; ip: string; maxPerIp: number }) {
    const k = (x: string) => `gojo:v:${x}:${siteId}:${day}`;
    // Who this address has added today (hashed ids only), capped: past the cap, no new people.
    const ipKey = `${k("i")}:${meta.ip}`;
    const [known, count] = await this.redis.pipeline().sismember(ipKey, visitorId).scard(ipKey).exec<[number, number]>();
    const allowed = known === 1 || count < meta.maxPerIp;
    const added = allowed ? await this.redis.pfadd(k("u"), visitorId) : 0;
    const p = this.redis.pipeline();
    if (allowed && known !== 1) {
      p.sadd(ipKey, visitorId);
      p.expire(ipKey, KEEP_SECONDS);
    }
    p.incr(k("n"));
    if (added === 1) {
      p.hincrby(k("r"), meta.source, 1);
      p.hincrby(k("d"), meta.device, 1);
    }
    p.sadd(`gojo:v:sites:${day}`, siteId);
    for (const key of [k("u"), k("n"), k("r"), k("d"), `gojo:v:sites:${day}`]) p.expire(key, KEEP_SECONDS);
    await p.exec();
  }
  async day(siteId: string, day: string): Promise<DayCounts | null> {
    return (await this.days(siteId, [day]))[0] ?? null;
  }
  async days(siteId: string, days: string[]): Promise<(DayCounts | null)[]> {
    if (!days.length) return [];
    const p = this.redis.pipeline();
    for (const day of days) {
      const k = (x: string) => `gojo:v:${x}:${siteId}:${day}`;
      p.pfcount(k("u")).get(k("n")).hgetall(k("r")).hgetall(k("d"));
    }
    const out = await p.exec<unknown[]>();
    return days.map((_, i) => {
      const [visitors, views, referrers, devices] = out.slice(i * 4, i * 4 + 4) as [number, string | number | null, Record<string, unknown> | null, Record<string, unknown> | null];
      const n = Number(views ?? 0);
      if (!n && !visitors) return null;
      return { views: n, visitors: Number(visitors ?? 0), referrers: pick(SOURCES, referrers), devices: pick(DEVICES, devices) };
    });
  }
  async sitesOn(day: string) {
    return (await this.redis.smembers(`gojo:v:sites:${day}`)) as string[];
  }
}
