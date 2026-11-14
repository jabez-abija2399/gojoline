import "server-only";
import { Redis } from "@upstash/redis";
import type { BuilderDeps } from "@/lib/builder/service";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { AnthropicLLMProvider } from "@/lib/providers/llm/anthropic";
import { DemoLLMProvider } from "@/lib/providers/llm/demo";
import { DEFAULT_MODEL } from "@/lib/providers/llm/pricing";
import { MemoryUsageLogger, type UsageLogger } from "@/lib/providers/llm/usage-log";
import { MemorySandboxProvider } from "@/lib/providers/sandbox/memory";
import { VercelSandboxProvider } from "@/lib/providers/sandbox/vercel";
import { MemoryRateLimiter, type RateLimiter } from "@/lib/rate-limit";
import { DenyAllRateLimiter, UpstashRateLimiter } from "@/lib/rate-limit/upstash";
import { templateFiles } from "@/lib/template/files";
import { MemoryLock, RedisLock, type Lock } from "@/lib/lock";
import { MemoryWaitlistStore, type WaitlistStore } from "@/lib/waitlist/store";

// The single place that picks service implementations from the environment.
type Env = NodeJS.ProcessEnv;
const isE2E = (env: Env) => env.E2E === "1";
const onVercelProd = (env: Env) => env.NODE_ENV === "production" && env.VERCEL === "1";

function pickRateLimiter(env: Env): RateLimiter {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashRateLimiter(new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }));
  }
  // Per-instance memory limits are no real limit on serverless: fail closed in production.
  if (onVercelProd(env)) {
    console.error("Rate limiter not configured: set UPSTASH_REDIS_REST_URL/TOKEN");
    return new DenyAllRateLimiter();
  }
  return new MemoryRateLimiter();
}

function redisFrom(env: Env): Redis | null {
  return env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null;
}

function pickLock(env: Env): Lock {
  const redis = redisFrom(env);
  return redis ? new RedisLock(redis) : new MemoryLock();
}

function starterFiles(): Record<string, string> {
  return Object.fromEntries(templateFiles().flatMap((f) => (typeof f.content === "string" ? [[f.path, f.content]] : [])));
}

function pickBuilder(env: Env, usage: UsageLogger): BuilderDeps | null {
  const store = new MemoryProjectStore();
  if (isE2E(env)) {
    return { store, sandboxes: new MemorySandboxProvider(starterFiles()), llm: new DemoLLMProvider(), usage, model: DEFAULT_MODEL, lock: new MemoryLock() };
  }
  const key = env.SAYSITE_ANTHROPIC_API_KEY;
  if (!key || !env.VERCEL_TOKEN || !env.VERCEL_TEAM_ID || !env.VERCEL_PROJECT_ID) return null;
  return {
    store,
    sandboxes: new VercelSandboxProvider({
      teamId: env.VERCEL_TEAM_ID,
      projectId: env.VERCEL_PROJECT_ID,
      token: env.VERCEL_TOKEN,
      snapshotId: env.SANDBOX_SNAPSHOT_ID,
    }),
    llm: new AnthropicLLMProvider(key),
    usage,
    model: env.AGENT_MODEL || DEFAULT_MODEL,
    lock: pickLock(env),
  };
}

interface Services {
  waitlist: WaitlistStore;
  rateLimiter: RateLimiter;
  usage: UsageLogger;
  /** null when AI or sandbox credentials are missing. */
  builder: BuilderDeps | null;
}

const globalForServices = globalThis as unknown as { gojoServices?: Services };

export function services(): Services {
  if (!globalForServices.gojoServices) {
    const usage = new MemoryUsageLogger();
    globalForServices.gojoServices = {
      waitlist: new MemoryWaitlistStore(),
      rateLimiter: pickRateLimiter(process.env),
      usage,
      builder: pickBuilder(process.env, usage),
    };
  }
  return globalForServices.gojoServices;
}
