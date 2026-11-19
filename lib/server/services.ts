import "server-only";
import { DbAdminStats, MemoryAdminStats, type AdminStats } from "@/lib/admin/stats";
import type { PaymentNoticeDeps } from "@/lib/billing/notify";
import { emailSender } from "@/lib/providers/notify/pick";
import { DbSettingsStore, MemorySettingsStore } from "@/lib/billing/settings";
import { LLMContentClassifier } from "@/lib/safety/classifier";
import { HeuristicSizer, LLMRequestSizer } from "@/lib/agent/size";
import { ContentGuard, checkOwnerText } from "@/lib/safety/guard";
import { DbReportStore, MemoryReportStore, type ReportStore } from "@/lib/safety/reports";
import type { ModerationDeps } from "@/lib/safety/takedown";
import type { SiteAdminStore } from "@/lib/sites/types";
import type { UsageReport } from "@/lib/providers/llm/usage-log";
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
import type { EntitlementsResolver } from "@/lib/billing/entitlements";
import { Billing } from "@/lib/billing/service";
import { DbBillingStore, MemoryBillingStore } from "@/lib/billing/store";
import { MemoryPublishProvider } from "@/lib/providers/publish/memory";
import { VercelPublishProvider } from "@/lib/providers/publish/vercel";
import { CloudflarePublishProvider } from "@/lib/providers/publish/cloudflare";
import { R2StorageProvider } from "@/lib/providers/storage/r2";
import { DbSiteStore } from "@/lib/sites/db-store";
import { MemorySiteStore } from "@/lib/sites/memory-store";
import { DbCloudStore } from "@/lib/cloud/db-store";
import { MemoryCloudStore } from "@/lib/cloud/memory-store";
import type { CloudStore, SubmissionNotifier } from "@/lib/cloud/types";
import { DbAssetStore, MemoryAssetStore } from "@/lib/cloud/assets";
import { BotApiClient, MemoryTelegramClient, type TelegramClient } from "@/lib/telegram/client";
import { DbSiteSettingsStore, MemorySiteSettingsStore, type SiteSettingsStore } from "@/lib/site-info/store";
import { MemoryVisitCounter, RedisVisitCounter } from "@/lib/visits/counter";
import { DbVisitsDailyStore, MemoryVisitsDailyStore } from "@/lib/visits/daily";
import type { VisitDeps } from "@/lib/visits/stats";
import { PublicSiteCache } from "@/lib/cloud/site-cache";
import { TelegramNotifier } from "@/lib/telegram/notifier";
import { DbTelegramStore, MemoryTelegramStore, type TelegramStore } from "@/lib/telegram/store";
import { DbFeedbackStore, MemoryFeedbackStore } from "@/lib/feedback/store";
import type { FeedbackStore } from "@/lib/feedback/types";
import { DbSignupSourceStore, MemorySignupSourceStore, type SignupSourceStore } from "@/lib/growth/sources";
import { DbReferralStore, MemoryReferralStore } from "@/lib/growth/referral-store";
import { Referrals } from "@/lib/growth/referrals";
import { DbShowcaseStore, MemoryShowcaseStore, type ShowcaseStore } from "@/lib/growth/showcase";

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
  const vercel = env.VERCEL_TOKEN && env.VERCEL_TEAM_ID ? new VercelPublishProvider({ token: env.VERCEL_TOKEN, teamId: env.VERCEL_TEAM_ID }) : null;
  const cloudflare = pickCloudflarePublish(env);
  // Cloudflare once it's configured; sites still on the Vercel fallback move on their next publish.
  if (cloudflare) return { ...base, publisher: cloudflare, legacy: vercel };
  return vercel ? { ...base, publisher: vercel } : null;
}

/** Sites on R2 + the sites Worker at *.PUBLISH_BASE_DOMAIN (see scripts/cloudflare-setup.mjs). */
function pickCloudflarePublish(env: Env): CloudflarePublishProvider | null {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.PUBLISH_BASE_DOMAIN) return null;
  const storage = new R2StorageProvider({ accountId: env.R2_ACCOUNT_ID, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, bucket: env.R2_BUCKET || "gojoline" });
  // The app's own token may only manage custom hostnames (never DNS, Workers or routes: those
  // are set up from the founder's machine with CLOUDFLARE_API_TOKEN, see the setup script).
  return new CloudflarePublishProvider({
    storage,
    baseDomain: env.PUBLISH_BASE_DOMAIN,
    apiToken: env.CLOUDFLARE_SAAS_TOKEN || undefined,
    zoneId: env.CLOUDFLARE_ZONE_ID || undefined,
    ownershipSecret: env.BETTER_AUTH_SECRET || undefined,
  });
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
  /** Plans, credits and manual payments. */
  billing: Billing;
  /** Plan limits per user. */
  entitlements: EntitlementsResolver;
  /** null when hosting credentials are missing. */
  publish: PublishDeps | null;
  /** null when AI or sandbox credentials are missing. */
  builder: BuilderDeps | null;
  /** AI cost totals for admins. */
  usageReport: UsageReport;
  /** Abuse reports and takedowns; null without a database or publishing. */
  moderation: ModerationDeps | null;
  /** Business details and the share preview the owner edits in the dashboard. */
  siteSettings: SiteSettingsStore;
  /** Privacy-friendly visit counts (Redis live, Postgres daily; memory without them). */
  visits: VisitDeps;
  /** Content check for words owners put live from the dashboard (rules, plus AI when configured). */
  checkText: (texts: string[], ctx: { userId: string; projectId: string }) => ReturnType<typeof checkOwnerText>;
  /** Sites as the public Data API sees them, cached a minute per server (info and visits routes). */
  publicSites: PublicSiteCache;
  /** Owner feedback and the team's replies. */
  feedback: FeedbackStore;
  /** Growth loops: sign-up sources, referrals, and the public showcase (null without publishing or a database). */
  growth: { sources: SignupSourceStore; referrals: Referrals; showcase: ShowcaseStore | null };
}

/** `ownerOf` serves the memory store only (the database joins projects instead). */
function pickVisits(env: Env, ownerOf: (projectId: string) => Promise<string | null>): VisitDeps {
  const db = getDb(env);
  const redis = isE2E(env) ? null : redisFrom(env);
  return { counter: redis ? new RedisVisitCounter(redis) : new MemoryVisitCounter(), daily: db ? new DbVisitsDailyStore(db) : new MemoryVisitsDailyStore(ownerOf) };
}

const globalForServices = globalThis as unknown as { gojoServices?: Services };

export function services(): Services {
  if (!globalForServices.gojoServices) {
    const db = getDb(process.env);
    const usage = db ? new DbUsageLogger(db) : new MemoryUsageLogger();
    const billing = new Billing(db ? new DbBillingStore(db) : new MemoryBillingStore(), undefined, db ? new DbSettingsStore(db) : new MemorySettingsStore());
    const sources = db ? new DbSignupSourceStore(db) : new MemorySignupSourceStore();
    globalForServices.gojoServices = {
      waitlist: db ? new DbWaitlistStore(db) : new MemoryWaitlistStore(),
      rateLimiter: pickRateLimiter(process.env),
      usage,
      builder: pickBuilder(process.env, usage),
      publish: null,
      billing,
      entitlements: billing.entitlements,
      cloud: null,
      notifier: null,
      telegram: null,
      usageReport: usage as unknown as UsageReport,
      moderation: null,
      siteSettings: db ? new DbSiteSettingsStore(db) : new MemorySiteSettingsStore(),
      visits: { counter: new MemoryVisitCounter(), daily: new MemoryVisitsDailyStore(async () => null) },
      checkText: (texts, ctx) => checkOwnerText(texts, null, ctx),
      publicSites: new PublicSiteCache(async () => null),
      growth: {
        sources,
        referrals: new Referrals(
          db ? new DbReferralStore(db) : new MemoryReferralStore((id) => memoryAccounts().find((u) => u.id === id) ?? null, (u, n, ref) => billing.store().addCredits(u, n, "referral", ref)),
          billing,
          sources,
        ),
        showcase: db ? new DbShowcaseStore(db) : null,
      },
      feedback: db
        ? new DbFeedbackStore(db)
        : new MemoryFeedbackStore(
            async (id) => {
              const u = await adminStats().user(id);
              return u ? { name: u.name, contact: u.contact, plan: u.plan } : null;
            },
            (e) => billing.store().audit(e),
          ),
    };
    const svc = globalForServices.gojoServices;
    billing.onApproved = (payment, adminId) => svc.growth.referrals.onPaymentApproved(payment, adminId);
    if (svc.builder) {
      svc.builder.credits = {
        consume: (u, r, n, meta) => billing.consumeEdit(u, r, n, meta),
        refund: (u, r, n, meta) => billing.giveBack(u, r, n, meta),
        refundAnswer: (u, r, n, meta) => billing.giveBackAnswer(u, r, n, meta),
        left: (u) => billing.creditsLeft(u),
        freeFirstBuild: (u, r) => billing.freeFirstBuild(u, r),
        pricing: async () => {
          const cs = await billing.credits();
          return { sizeCredits: cs.sizeCredits, capCentsPerCredit: cs.capCentsPerCredit, firstBuildCapCents: cs.firstBuildCapCents };
        },
      };
      // Claude Haiku sizes requests when an API key is set (never in e2e: the word list does).
      const key = process.env.SAYSITE_ANTHROPIC_API_KEY;
      svc.builder.sizer = key && !isE2E(process.env) ? new LLMRequestSizer(new AnthropicLLMProvider(key), usage, process.env.SIZE_MODEL || "claude-haiku-5-5") : new HeuristicSizer();
    }
    svc.publish = pickPublish(process.env, svc.builder);
    if (!db && svc.publish && svc.builder) svc.growth.showcase = new MemoryShowcaseStore(svc.publish.sites as MemorySiteStore, svc.builder.store);
    if (svc.publish && svc.growth.showcase) {
      svc.publish.showcase = svc.growth.showcase;
      svc.publish.showcaseChanged = showcaseChanged;
    }
    const settingsDb = svc.siteSettings instanceof DbSiteSettingsStore ? svc.siteSettings : null;
    svc.publicSites = new PublicSiteCache(async (id) => {
      if (settingsDb) return settingsDb.publicEntry(id);
      const site = await svc.publish?.cloud?.publicSite(id);
      return site ? { site, business: await svc.siteSettings.publicBusiness(id) } : null;
    });
    svc.visits = pickVisits(process.env, async (id) => (await svc.publish?.cloud?.publicSite(id))?.ownerId ?? null);
    if (svc.publish) {
      svc.publish.entitlements = billing.entitlements;
      svc.publish.settings = svc.siteSettings;
      // Keywords always; the AI check when an API key is set (never in e2e).
      const key = process.env.SAYSITE_ANTHROPIC_API_KEY;
      const classifier = key && !isE2E(process.env) ? new LLMContentClassifier(new AnthropicLLMProvider(key), usage, process.env.SAFETY_MODEL || "claude-haiku-5-5") : null;
      svc.publish.guards = [new ContentGuard(classifier)];
      svc.checkText = (texts, ctx) => checkOwnerText(texts, classifier, ctx);
    }
    svc.cloud = svc.publish?.cloud ?? null;
    const siteAdmin = (svc.publish?.sites as unknown as SiteAdminStore | undefined) ?? (db ? new DbSiteStore(db) : null);
    if (siteAdmin) {
      const reports: ReportStore = db
        ? new DbReportStore(db)
        : new MemoryReportStore(async (id) => {
            const s = await siteAdmin.byId(id);
            return s ? { slug: s.slug, url: s.url, status: s.status } : null;
          });
      svc.moderation = { sites: siteAdmin, reports, publisher: svc.publish?.publisher ?? null, legacy: svc.publish?.legacy ?? null, lock: svc.publish?.lock, audit: (e) => billing.store().audit(e), invalidate: (id) => {
          globalForServices.gojoServices?.publicSites.invalidate(id);
          showcaseChanged();
        },
      };
    }
    svc.telegram = pickTelegram(process.env);
    if (svc.telegram && svc.builder) svc.notifier = new TelegramNotifier(svc.telegram.store, svc.telegram.client, svc.builder.store);
  }
  return globalForServices.gojoServices;
}

/** Who to tell about payments, and how (email via Resend, Telegram when linked). */
export function paymentNotices(): PaymentNoticeDeps {
  const svc = services();
  const list = (v: string | undefined) => (v ?? "").split(",").map((x) => x.trim()).filter((x) => x.includes("@"));
  return {
    email: emailSender(),
    appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    adminEmails: list(process.env.ADMIN_EMAILS),
    store: svc.billing.store(),
    telegram: svc.telegram,
  };
}

/** Clears the public showcase's cache (loaded lazily: the cache module reads services()). */
function showcaseChanged(): void {
  void import("@/lib/growth/showcase-cache").then((m) => m.invalidateShowcase()).catch(() => undefined);
}

/** Accounts in the in-memory auth store (development and e2e only). */
function memoryAccounts(): { id: string; name: string; email: string; phoneNumber?: string | null; createdAt: Date }[] {
  return (globalThis as unknown as { gojoAuthMemory?: { user?: { id: string; name: string; email: string; phoneNumber?: string | null; createdAt: Date }[] } }).gojoAuthMemory?.user ?? [];
}

/** Admin overview numbers and user list (database when available). */
export function adminStats(): AdminStats {
  const db = getDb(process.env);
  if (db) return new DbAdminStats(db);
  const svc = services();
  const memory = (globalThis as unknown as { gojoAuthMemory?: { user?: { id: string; name: string; email: string; phoneNumber?: string | null; createdAt: Date }[] } }).gojoAuthMemory;
  return new MemoryAdminStats({
    counts: async () => ({
      pendingPayments: (await svc.billing.store().pendingPayments()).length,
      openReports: ((await svc.moderation?.reports.openBySite(1000)) ?? []).reduce((n, g) => n + g.reports.length, 0),
      sitesLive: ((await svc.moderation?.sites.recent(1000)) ?? []).filter((x) => x.status === "published").length,
    }),
    accounts: () => memory?.user ?? [],
    billing: svc.billing.store(),
    projects: async (ownerId) => (await svc.builder?.store.listProjects(ownerId)) ?? [],
  });
}
