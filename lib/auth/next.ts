/**
 * Where to go after sign-in: only same-site paths, so the redirect can't send people elsewhere.
 * The one query allowed is `?product=` (a pricing "Choose" button preselecting what to pay for).
 */
export function safeNext(lang: string, raw: string): string {
  return /^\/(en|am)\/[\w\-/]*(\?product=[a-z_]{1,20})?$/.test(raw) && !raw.includes("//") ? raw : `/${lang}/build`;
}
