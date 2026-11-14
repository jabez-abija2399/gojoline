/**
 * Values Gojoline sets at publish time through build environment variables.
 * Locked: the agent can't change these.
 */
const env = import.meta.env;

export const publishMeta = {
  url: (env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") || undefined,
  siteId: (env.VITE_SITE_ID as string | undefined) || undefined,
  reportUrl: (env.VITE_REPORT_URL as string | undefined) || "https://gojoline.com/report",
  dataApiUrl: (env.VITE_DATA_API_URL as string | undefined) || undefined,
  badge: env.VITE_BADGE !== "0",
};
