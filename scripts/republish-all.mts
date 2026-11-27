// Moves every live site to the app's current host (our own server since 2026-11-27): each site
// still on Vercel (or any other host) is published again from its live version, through the
// app's normal publish path (content checks, badge, forms), keeping offline and takedown state.
// The app does the work (/api/cron/republish, one site per request); this script only drives it.
// Run it off-peak: each site is a build on the same server builders use.
//
//   node scripts/republish-all.mts --env deploy/server/.env --dry-run   # list, change nothing
//   node scripts/republish-all.mts --env deploy/server/.env             # move the sites
//   node scripts/republish-all.mts --env deploy/server/.env --forward-old   # after 2026-12-19
//   --only <slug>   one site            --limit <n>   at most n sites this run
//   --delay <s>     seconds between sites (default 30)
//
// Before each site it asks how many site workspaces are open; while builders use all of them it
// waits (up to 10 minutes), so their previews are never stopped for this. Needs APP_DOMAIN (or
// APP_URL) and CRON_SECRET, from --env or the environment. Safe to run again: sites already
// moved are skipped. Exits 1 when any site failed or was left for later.
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
  limit?: number;
  delayMs: number;
}

/** Let's Encrypt allows 50 new certificates a week per domain (previews share them): warn above this. */
export const CERT_WARN = 35;
const WAIT_STEP_MS = 30_000;
const WAIT_MAX_MS = 10 * 60_000;

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
  const value = (flag: string) => {
    const at = argv.indexOf(flag);
    return at >= 0 ? (argv[at + 1] ?? "") : undefined;
  };
  const envPath = value("--env");
  if (envPath === "") return "--env needs a file";
  if (envPath) file = parseEnv(readFileSync(envPath, "utf8"));
  const get = (k: string) => env[k] || file[k] || "";
  const domain = get("APP_DOMAIN");
  const appUrl = (get("APP_URL") || (domain ? `https://${domain}` : "")).replace(/\/$/, "");
  const secret = get("CRON_SECRET");
  if (!appUrl || !secret) return "Set APP_DOMAIN (or APP_URL) and CRON_SECRET, or pass --env deploy/server/.env";
  const limit = value("--limit");
  const delay = value("--delay");
  if (limit !== undefined && !/^[1-9]\d*$/.test(limit)) return "--limit needs a number of sites";
  if (delay !== undefined && !/^\d+$/.test(delay)) return "--delay needs a number of seconds";
  return {
    appUrl,
    secret,
    dryRun: argv.includes("--dry-run"),
    mode: argv.includes("--forward-old") ? "forward" : "move",
    only: value("--only"),
    limit: limit ? Number(limit) : undefined,
    delayMs: delay !== undefined ? Number(delay) * 1000 : 30_000,
  };
}

/** The sites a run acts on, in order (the plan comes from the app). */
export function toRun(items: Item[], only?: string, limit?: number): Item[] {
  const todo = items.filter((i) => i.action !== "skip" && (!only || i.slug === only));
  return limit ? todo.slice(0, limit) : todo;
}

/** New certificates a run needs (sites that get a new address here). */
export function newCertificates(items: Item[]): number {
  return items.filter((i) => i.action === "republish" || i.action === "notice").length;
}

const sleepReal = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function run(opts: Options, fetchImpl: typeof fetch = fetch, log: (line: string) => void = console.log, sleep: (ms: number) => Promise<unknown> = sleepReal): Promise<number> {
  const auth = { Authorization: `Bearer ${opts.secret}` };
  const res = await fetchImpl(`${opts.appUrl}/api/cron/republish?mode=${opts.mode}`, { headers: auth });
  if (!res.ok) {
    log(`The app refused the list (${res.status}). Check CRON_SECRET and that the app is up.`);
    return 1;
  }
  const plan = (await res.json()) as { host: string; paused: boolean; wildcardTls?: boolean; items: Item[] };
  const items = plan.items.filter((i) => !opts.only || i.slug === opts.only);
  log(`Host: ${plan.host}${plan.paused ? " (building is paused: nothing can be republished)" : ""}. ${items.length} site(s).`);
  for (const i of items) log(`${i.action === "skip" ? "skip     " : opts.dryRun ? "would    " : "plan     "} ${i.slug.padEnd(40)} ${i.action.padEnd(9)} from ${i.from}${i.url ? ` (${i.url})` : ""}: ${i.note}`);
  const todo = toRun(plan.items, opts.only, opts.limit);
  const certs = newCertificates(todo);
  if (opts.mode === "move" && !plan.wildcardTls && certs > CERT_WARN) {
    log(`WARNING: ${certs} sites would each need a new certificate; Let's Encrypt allows 50 a week for the whole domain (previews too). Set up the wildcard certificate first (README 8d), or move at most ${CERT_WARN} a week with --limit ${CERT_WARN}.`);
  }
  if (opts.dryRun) {
    log(`Dry run: ${todo.length} site(s) would change. Nothing was changed.`);
    return 0;
  }
  let failed = 0;
  let left = 0;
  for (const [n, i] of todo.entries()) {
    if (n > 0 && opts.delayMs > 0) await sleep(opts.delayMs);
    // Builders first: wait while every site workspace is in use.
    let waited = 0;
    for (;;) {
      const s = await fetchImpl(`${opts.appUrl}/api/cron/republish?status=1`, { headers: auth })
        .then((r) => r.json() as Promise<{ workspaces?: { running: number; max: number } | null }>)
        .catch(() => ({ workspaces: null }));
      const w = s.workspaces;
      if (!w || w.running < w.max || waited >= WAIT_MAX_MS) break;
      if (waited === 0) log(`wait      ${i.slug.padEnd(40)} builders are using ${w.running} of ${w.max} workspaces`);
      await sleep(WAIT_STEP_MS);
      waited += WAIT_STEP_MS;
    }
    if (waited >= WAIT_MAX_MS) {
      left++;
      log(`later     ${i.slug.padEnd(40)} workspaces stayed busy; run again later`);
      continue;
    }
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
  const ok = todo.length - failed - left;
  log(`Done: ${ok} ok, ${failed} failed${left ? `, ${left} left for later` : ""}.${failed || left ? " Run again to retry." : ""}`);
  return failed || left ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const opts = parseArgs(process.argv.slice(2), process.env);
  if (typeof opts === "string") {
    console.error(opts);
    process.exit(2);
  }
  process.exit(await run(opts));
}
