// Moves every live site to the app's current host (our own server since 2026-11-27): each site
// still on Vercel (or any other host) is published again from its live version, through the
// app's normal publish path (content checks, badge, forms), keeping offline and takedown state.
// The app does the work (/api/cron/republish, one site per request); this script only drives it.
//
//   node scripts/republish-all.mts --env deploy/server/.env --dry-run   # list, change nothing
//   node scripts/republish-all.mts --env deploy/server/.env             # move the sites
//   node scripts/republish-all.mts --env deploy/server/.env --forward-old   # after 2026-12-19
//   (--only <slug> limits a run to one site)
//
// Needs APP_DOMAIN (or APP_URL) and CRON_SECRET, from --env or the environment. Safe to run
// again: sites already moved are skipped. Exits 1 when any site failed.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export interface Item {
  siteId: string;
  slug: string;
  from: string;
  url: string | null;
  action: "republish" | "notice" | "forward" | "skip";
  note: string;
  offline: boolean;
}

export interface Options {
  appUrl: string;
  secret: string;
  dryRun: boolean;
  mode: "move" | "forward";
  only?: string;
}

/** KEY=value lines (as deploy/server/.env is written); comments and blanks ignored. */
export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]!] = m[2]!.trim();
  }
  return out;
}

export function parseArgs(argv: string[], env: Record<string, string | undefined>): Options | string {
  let file: Record<string, string> = {};
  const at = argv.indexOf("--env");
  if (at >= 0) {
    const path = argv[at + 1];
    if (!path) return "--env needs a file";
    file = parseEnv(readFileSync(path, "utf8"));
  }
  const get = (k: string) => env[k] || file[k] || "";
  const domain = get("APP_DOMAIN");
  const appUrl = (get("APP_URL") || (domain ? `https://${domain}` : "")).replace(/\/$/, "");
  const secret = get("CRON_SECRET");
  if (!appUrl || !secret) return "Set APP_DOMAIN (or APP_URL) and CRON_SECRET, or pass --env deploy/server/.env";
  const o = argv.indexOf("--only");
  return { appUrl, secret, dryRun: argv.includes("--dry-run"), mode: argv.includes("--forward-old") ? "forward" : "move", only: o >= 0 ? argv[o + 1] : undefined };
}

/** The sites a run acts on, in order (the plan comes from the app). */
export function toRun(items: Item[], only?: string): Item[] {
  return items.filter((i) => i.action !== "skip" && (!only || i.slug === only));
}

export async function run(opts: Options, fetchImpl: typeof fetch = fetch, log: (line: string) => void = console.log): Promise<number> {
  const auth = { Authorization: `Bearer ${opts.secret}` };
  const res = await fetchImpl(`${opts.appUrl}/api/cron/republish?mode=${opts.mode}`, { headers: auth });
  if (!res.ok) {
    log(`The app refused the list (${res.status}). Check CRON_SECRET and that the app is up.`);
    return 1;
  }
  const plan = (await res.json()) as { host: string; paused: boolean; items: Item[] };
  const items = plan.items.filter((i) => !opts.only || i.slug === opts.only);
  log(`Host: ${plan.host}${plan.paused ? " (building is paused: nothing can be republished)" : ""}. ${items.length} site(s).`);
  for (const i of items) log(`${i.action === "skip" ? "skip     " : opts.dryRun ? "would    " : "plan     "} ${i.slug.padEnd(40)} ${i.action.padEnd(9)} from ${i.from}${i.url ? ` (${i.url})` : ""}: ${i.note}`);
  const todo = toRun(plan.items, opts.only);
  if (opts.dryRun) {
    log(`Dry run: ${todo.length} site(s) would change. Nothing was changed.`);
    return 0;
  }
  let failed = 0;
  for (const i of todo) {
    const started = Date.now();
    try {
      const r = await fetchImpl(`${opts.appUrl}/api/cron/republish`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ siteId: i.siteId, mode: opts.mode }) });
      const out = (await r.json().catch(() => ({}))) as { result?: { ok: boolean; url?: string | null; note?: string; error?: string; reasons?: string[] } };
      const secs = Math.round((Date.now() - started) / 1000);
      if (out.result?.ok) log(`ok        ${i.slug.padEnd(40)} ${out.result.note ?? ""}${out.result.url ? ` → ${out.result.url}` : ""} (${secs} s)`);
      else {
        failed++;
        log(`FAILED    ${i.slug.padEnd(40)} ${out.result?.error ?? `HTTP ${r.status}`}${out.result?.reasons?.length ? `: ${out.result.reasons.join("; ")}` : ""} (${secs} s)`);
      }
    } catch (e) {
      failed++;
      log(`FAILED    ${i.slug.padEnd(40)} ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  log(`Done: ${todo.length - failed} ok, ${failed} failed.${failed ? " Run again to retry the failed ones." : ""}`);
  return failed ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const opts = parseArgs(process.argv.slice(2), process.env);
  if (typeof opts === "string") {
    console.error(opts);
    process.exit(2);
  }
  process.exit(await run(opts));
}
