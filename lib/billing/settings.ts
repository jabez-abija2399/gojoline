import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/lib/db/client";
import { appSettings } from "@/lib/db/schema";
import { mergeCreditSettings, type CreditSettings } from "./credits";
import { launchOfferSchema, type LaunchOffer } from "./discounts";
import { PRODUCTS, type Product } from "./plans";

/** What admins can change without a deploy. Prices in integer santim; never floats. */
export const billingSettingsSchema = z.object({
  prices: z.object(Object.fromEntries(Object.keys(PRODUCTS).map((k) => [k, z.number().int().min(100).max(100_000_000)])) as Record<Product, z.ZodNumber>),
  telebirrNumber: z.string().trim().max(40),
  cbeAccount: z.string().trim().max(60),
  accountName: z.string().trim().max(120),
});
export type BillingSettings = z.infer<typeof billingSettingsSchema>;

export interface SettingsStore {
  get(key: string): Promise<Record<string, unknown> | null>;
  set(key: string, value: Record<string, unknown>, by: string): Promise<void>;
  /**
   * One atomic change to a saved value: drops `remove` keys, then sets `patch` keys; other keys
   * are untouched. A missing row is created from `create` plus the patch, or left missing (null)
   * when `create` is null. Returns the new value.
   */
  merge(key: string, patch: Record<string, unknown>, remove: string[], by: string, create: Record<string, unknown> | null): Promise<Record<string, unknown> | null>;
}

export class MemorySettingsStore implements SettingsStore {
  private data = new Map<string, Record<string, unknown>>();
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async set(key: string, value: Record<string, unknown>) {
    this.data.set(key, value);
  }
  async merge(key: string, patch: Record<string, unknown>, remove: string[], _by: string, create: Record<string, unknown> | null) {
    const old = this.data.get(key);
    if (!old && !create) return null;
    const next = { ...(old ?? create) };
    for (const k of remove) delete next[k];
    Object.assign(next, patch);
    this.data.set(key, next);
    return next;
  }
}

export class DbSettingsStore implements SettingsStore {
  constructor(private db: Database) {}
  async get(key: string) {
    const [row] = await this.db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return row?.value ?? null;
  }
  async set(key: string, value: Record<string, unknown>, by: string) {
    await this.db
      .insert(appSettings)
      .values({ key, value, updatedBy: by })
      .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: by, updatedAt: new Date() } });
  }
  async merge(key: string, patch: Record<string, unknown>, remove: string[], by: string, create: Record<string, unknown> | null) {
    // One statement, so a change made at the same moment to another key is never lost.
    const dropped = remove.length ? sql`(${appSettings.value} - ARRAY[${sql.join(remove.map((k) => sql`${k}`), sql`, `)}]::text[])` : sql`${appSettings.value}`;
    const merged = sql`${dropped} || ${JSON.stringify(patch)}::jsonb`;
    if (!create) {
      const [row] = await this.db.update(appSettings).set({ value: merged, updatedBy: by, updatedAt: new Date() }).where(eq(appSettings.key, key)).returning({ value: appSettings.value });
      return row?.value ?? null;
    }
    const [row] = await this.db
      .insert(appSettings)
      .values({ key, value: { ...create, ...patch }, updatedBy: by })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: merged, updatedBy: by, updatedAt: new Date() } })
      .returning({ value: appSettings.value });
    return row?.value ?? null;
  }
}

/** Defaults: prices from plans.ts, payment accounts from env (until an admin saves them). */
export function defaultBillingSettings(env: NodeJS.ProcessEnv = process.env): BillingSettings {
  return {
    prices: Object.fromEntries(Object.entries(PRODUCTS).map(([k, v]) => [k, v.amountMinor])) as Record<Product, number>,
    telebirrNumber: env.PAYMENT_TELEBIRR_NUMBER ?? "",
    cbeAccount: env.PAYMENT_CBE_ACCOUNT ?? "",
    accountName: env.PAYMENT_ACCOUNT_NAME ?? "",
  };
}

export async function loadBillingSettings(store: SettingsStore, env: NodeJS.ProcessEnv = process.env): Promise<BillingSettings> {
  const base = defaultBillingSettings(env);
  const saved = await store.get("billing").catch(() => null);
  if (!saved) return base;
  const merged = { ...base, ...saved, prices: { ...base.prices, ...((saved.prices as object) ?? {}) } };
  const parsed = billingSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}

/** Credit amounts (monthly changes, rollover, sizes, cost cap): saved values over the defaults. */
export async function loadCreditSettings(store: SettingsStore): Promise<CreditSettings> {
  return mergeCreditSettings(await store.get("credits").catch(() => null));
}

/** The launch offer, or null when none was saved (or the saved one is invalid). */
export async function loadLaunchOffer(store: SettingsStore): Promise<LaunchOffer | null> {
  const saved = await store.get("offer").catch(() => null);
  const parsed = launchOfferSchema.safeParse(saved);
  return parsed.success ? parsed.data : null;
}
