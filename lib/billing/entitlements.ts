/**
 * What a user's plan allows. Slice 6 (billing) computes this from the user's subscription;
 * until then everyone is on Free.
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
}

export const FREE: Entitlements = { plan: "free", customDomain: false, maxSites: 1, badge: true, telegramNotify: false, telegramEdits: false, answersPerMonth: 100 };

export type EntitlementsResolver = (userId: string) => Promise<Entitlements>;

export const freeForEveryone: EntitlementsResolver = async () => FREE;
