/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_SITE_ID?: string;
  readonly VITE_REPORT_URL?: string;
  readonly VITE_DATA_API_URL?: string;
  readonly VITE_SITE_KEY?: string;
  /** JSON from the owner's Google and share preview: { title?, description?, image?, icon? }. */
  readonly VITE_SEO?: string;
  /** JSON: the owner's business details and banner as they were at publish (baked into the pages). */
  readonly VITE_LIVE?: string;
  readonly VITE_REST_AT_HOST?: string;
}
