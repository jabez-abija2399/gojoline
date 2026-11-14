/**
 * What a user's plan allows. Slice 6 (billing) computes this from the user's subscription;
 * until then everyone is on Free.
 */
export interface Entitlements {
  plan: "free" | "starter" | "business";
  customDomain: boolean;
  maxSites: number;
  badge: boolean;
}

export const FREE: Entitlements = { plan: "free", customDomain: false, maxSites: 1, badge: true };

export type EntitlementsResolver = (userId: string) => Promise<Entitlements>;

export const freeForEveryone: EntitlementsResolver = async () => FREE;
