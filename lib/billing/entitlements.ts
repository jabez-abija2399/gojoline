/**
 * What a user's plan allows, enforced on the server. `PLAN_FEATURES` in plans.ts holds the
 * numbers for each plan; the billing service picks the row for the user's subscription.
 */
export interface Entitlements {
  plan: "free" | "starter" | "business";
  customDomain: boolean;
  maxSites: number;
  badge: boolean;
  /** Answers on Telegram (Starter and up). */
  telegramNotify: boolean;
  /** Edit the site by Telegram message (Business). */
  telegramEdits: boolean;
  /** Form answers per site per month. */
  answersPerMonth: number;
  /** Photo storage across all of the owner's sites, in bytes. */
  storageBytes: number;
}

export const MB = 1024 * 1024;

export const FREE: Entitlements = { plan: "free", customDomain: false, maxSites: 1, badge: true, telegramNotify: false, telegramEdits: false, answersPerMonth: 100, storageBytes: 50 * MB };

export type EntitlementsResolver = (userId: string) => Promise<Entitlements>;

export const freeForEveryone: EntitlementsResolver = async () => FREE;
