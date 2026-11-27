/** The Plan page's tabs, in order (shared by the server page and the client tabs). */
export const BILLING_TABS = ["plan", "pay", "history", "invite"] as const;
export type BillingTab = (typeof BILLING_TABS)[number];
