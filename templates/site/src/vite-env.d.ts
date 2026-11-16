/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_SITE_ID?: string;
  readonly VITE_REPORT_URL?: string;
  readonly VITE_DATA_API_URL?: string;
  readonly VITE_BADGE?: string;
  readonly VITE_SITE_KEY?: string;
  /** JSON from the owner's Google and share preview: { title?, description?, image?, icon? }. */
  readonly VITE_SEO?: string;
}
