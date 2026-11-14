import "server-only";
import { Redis } from "@upstash/redis";
import type { BuilderDeps } from "@/lib/builder/service";
import { getDb } from "@/lib/db/client";
import { DbProjectStore } from "@/lib/projects/db-store";
import { MemoryProjectStore } from "@/lib/projects/memory-store";
import { DbUsageLogger } from "@/lib/providers/llm/db-usage-log";
import { DbWaitlistStore } from "@/lib/waitlist/db-store";
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
import type { PublishDeps } from "@/lib/publish/service";
import { freeForEveryone, type EntitlementsResolver } from "@/lib/billing/entitlements";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { VercelPublishProvider } from "@/lib/providers/publish/vercel";
import { DbSiteStore } from "@/lib/sites/db-store";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { DbCloudStore } from "@/lib/cloud/db-store";
import { MemoryCloudStore } from "@/lib/cloud/memory-store";
import type { CloudStore, SubmissionNotifier } from "@/lib/cloud/types";
import { DbAssetStore, MemoryAssetStore } from "@/lib/cloud/assets";
import { BotApiClient, MemoryTelegramClient, type TelegramClient } from "@/lib/telegram/client";
import { TelegramNotifier } from "@/lib/telegram/notifier";
import { DbTelegramStore, MemoryTelegramStore, type TelegramStore } from "@/lib/telegram/store";

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
  const db = getDb(env);
  const store = db ? new DbProjectStore(db) : new MemoryProjectStore();
  const assets = db ? new DbAssetStore(db) : new MemoryAssetStore();
  if (isE2E(env)) {
    return { store, sandboxes: new MemorySandboxProvider(starterFiles()), llm: new DemoLLMProvider(), usage, model: DEFAULT_MODEL, lock: new MemoryLock(), assets };
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
    assets,
  };
}

function pickPublish(env: Env, builder: BuilderDeps | null): PublishDeps | null {
  if (!builder) return null;
  const db = getDb(env);
  const sites = db ? new DbSiteStore(db) : new MemorySiteStore();
  const cloud: CloudStore = db ? new DbCloudStore(db) : new MemoryCloudStore(sites as MemorySiteStore);
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const base = { store: builder.store, sandboxes: builder.sandboxes, lock: builder.lock, assets: builder.assets, sites, cloud, appUrl, dataApiOrigin: env.DATA_API_ORIGIN || undefined };
  if (isE2E(env)) return { ...base, publisher: new MemoryPublishProvider() };
  if (!env.VERCEL_TOKEN || !env.VERCEL_TEAM_ID) return null;
  return { ...base, publisher: new VercelPublishProvider({ token: env.VERCEL_TOKEN, teamId: env.VERCEL_TEAM_ID }) };
}

function pickTelegram(env: Env): Services["telegram"] {
  const db = getDb(env);
  const username = env.TELEGRAM_BOT_USERNAME || "gojoline_bot";
  if (isE2E(env)) return { store: new MemoryTelegramStore(), client: new MemoryTelegramClient(), username };
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  return { store: db ? new DbTelegramStore(db) : new MemoryTelegramStore(), client: new BotApiClient(env.TELEGRAM_BOT_TOKEN), username };
}

interface Services {
  waitlist: WaitlistStore;
  rateLimiter: RateLimiter;
  usage: UsageLogger;
  /** Gojoline Cloud data (forms, submissions); null when publishing is unavailable. */
  cloud: CloudStore | null;
  /** Tells owners about new submissions (Telegram, Slice 5). */
  notifier: SubmissionNotifier | null;
  /** Telegram bot (null without TELEGRAM_BOT_TOKEN, except in e2e). */
  telegram: { store: TelegramStore; client: TelegramClient; username: string } | null;
  /** Plan limits per user (billing replaces the free default in Slice 6). */
  entitlements: EntitlementsResolver;
  /** null when hosting credentials are missing. */
  publish: PublishDeps | null;
  /** null when AI or sandbox credentials are missing. */
  builder: BuilderDeps | null;
}

const globalForServices = globalThis as unknown as { gojoServices?: Services };

export function services(): Services {
  if (!globalForServices.gojoServices) {
    const db = getDb(process.env);
    const usage = db ? new DbUsageLogger(db) : new MemoryUsageLogger();
    globalForServices.gojoServices = {
      waitlist: db ? new DbWaitlistStore(db) : new MemoryWaitlistStore(),
      rateLimiter: pickRateLimiter(process.env),
      usage,
      builder: pickBuilder(process.env, usage),
      publish: null,
      entitlements: freeForEveryone,
      cloud: null,
      notifier: null,
      telegram: null,
    };
    const svc = globalForServices.gojoServices;
    svc.publish = pickPublish(process.env, svc.builder);
    svc.cloud = svc.publish?.cloud ?? null;
    svc.telegram = pickTelegram(process.env);
    if (svc.telegram && svc.builder) svc.notifier = new TelegramNotifier(svc.telegram.store, svc.telegram.client, svc.builder.store);
  }
  return globalForServices.gojoServices;
}
