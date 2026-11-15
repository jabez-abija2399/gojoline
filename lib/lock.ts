import { randomUUID } from "node:crypto";
import type { Redis } from "@upstash/redis";

/** Mutual exclusion per key across server instances (one agent run or restore per project). */
export interface Lock {
  /** Returns a token when acquired, null when someone else holds it. */
  acquire(key: string, ttlMs: number): Promise<string | null>;
  release(key: string, token: string): Promise<void>;
}

export class MemoryLock implements Lock {
  private held = new Map<string, { token: string; until: number }>();
  async acquire(key: string, ttlMs: number) {
    const now = Date.now();
    const cur = this.held.get(key);
    if (cur && cur.until > now) return null;
    const token = randomUUID();
    this.held.set(key, { token, until: now + ttlMs });
    return token;
  }
  async release(key: string, token: string) {
    if (this.held.get(key)?.token === token) this.held.delete(key);
  }
}

const RELEASE = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

export class RedisLock implements Lock {
  constructor(private redis: Redis) {}
  async acquire(key: string, ttlMs: number) {
    const token = randomUUID();
    const ok = await this.redis.set(`gojo:lock:${key}`, token, { nx: true, px: ttlMs });
    return ok === "OK" ? token : null;
  }
  async release(key: string, token: string) {
    await this.redis.eval(RELEASE, [`gojo:lock:${key}`], [token]);
  }
}
