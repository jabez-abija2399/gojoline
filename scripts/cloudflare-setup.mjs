// One-time (and repeatable) setup for publishing customer sites on Cloudflare.
//
//   node scripts/cloudflare-setup.mjs            # read-only: prints what it would change
//   node scripts/cloudflare-setup.mjs --apply    # makes the changes
//
// Needs CLOUDFLARE_API_TOKEN, R2_ACCOUNT_ID (the Cloudflare account ID) and PUBLISH_BASE_DOMAIN
// (a zone on that account, e.g. afridea.et). Optional: R2_BUCKET (default gojoline),
// NEXT_PUBLIC_APP_URL (the builder's address, kept on Vercel), VERCEL_TOKEN + VERCEL_TEAM_ID
// (to keep every Vercel-served name under the zone on Vercel).
//
// What it does, in order (each step is skipped when already done):
//  1. R2 bucket for site files.
//  2. Uploads the sites Worker (workers/sites/worker.ts) with the bucket bound as SITES.
//  3. DNS: names that live on Vercel only through the wildcard get their own DNS-only record
//     first, so they never change hands; then `*.<zone>` is proxied (orange cloud) and
//     `domains.<zone>` is added as the target for customers' own domains.
//  4. Routes: `*.<zone>/*` and `*/*` (customers' own domains) go to the Worker; every other
//     name in the zone gets an exclusion route, so nothing else is ever served by it.
//  5. Fallback origin for custom hostnames (Cloudflare for SaaS), when it's enabled.
// It never deletes DNS records, buckets or Workers.

import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

// CLOUDFLARE_API_BASE: tests only (a fake API).
const API = process.env.CLOUDFLARE_API_BASE || "https://api.cloudflare.com/client/v4";
const apply = process.argv.includes("--apply");
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.R2_ACCOUNT_ID;
const base = (process.env.PUBLISH_BASE_DOMAIN || "").toLowerCase();
const bucket = process.env.R2_BUCKET || "gojoline";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://gojoline.${base}`;
const script = "gojoline-sites";
const target = `domains.${base}`;

if (!token || !account || !base) {
  console.error("Set CLOUDFLARE_API_TOKEN, R2_ACCOUNT_ID and PUBLISH_BASE_DOMAIN.");
  process.exit(1);
}

const log = (s) => console.log(s);
const plan = (s) => console.log(`${apply ? "  → " : "  would "}${s}`);

async function cf(method, path, body, raw) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(raw ? {} : { "Content-Type": "application/json" }) },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.success !== false, status: res.status, result: data.result, errors: data.errors ?? [], info: data.result_info };
}
const fail = (what, r) => {
  console.error(`✗ ${what} (${r.status}): ${r.errors.map((e) => `${e.code} ${e.message}`).join("; ")}`);
  process.exit(1);
};

async function all(path) {
  const out = [];
  for (let page = 1; ; page++) {
    const r = await cf("GET", `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    if (!r.ok) fail(`GET ${path}`, r);
    out.push(...(r.result ?? []));
    if (!r.info || page >= (r.info.total_pages ?? 1)) return out;
  }
}

// 0. Token and zone.
const verify = await cf("GET", "/user/tokens/verify");
if (!verify.ok) fail("API token check", verify);
const zones = await cf("GET", `/zones?name=${encodeURIComponent(base)}`);
const zone = zones.result?.[0];
if (!zones.ok || !zone) fail(`zone ${base} not found on this token`, zones);
log(`Zone ${base} (${zone.id}), plan ${zone.plan?.name ?? "?"}. ${apply ? "APPLYING" : "Dry run (add --apply to make changes)"}.`);

// 1. Bucket.
log("\n1. R2 bucket");
const b = await cf("GET", `/accounts/${account}/r2/buckets/${bucket}`);
if (b.ok) log(`  ✓ ${bucket} exists`);
else if (b.errors.some((e) => e.code === 10042)) fail("R2 is not enabled: Cloudflare dashboard → R2 Object Storage → enable it, then run again", b);
else {
  // Eastern Europe is the nearest R2 region to Ethiopia (the edge cache serves repeat visits).
  plan(`create bucket ${bucket} (location hint eeur)`);
  if (apply) {
    const c = await cf("POST", `/accounts/${account}/r2/buckets`, { name: bucket, locationHint: "eeur" });
    if (!c.ok) fail("create bucket", c);
  }
}

// 2. Worker.
log("\n2. Sites Worker");
const source = stripTypeScriptTypes(readFileSync(new URL("../workers/sites/worker.ts", import.meta.url), "utf8"));
plan(`upload ${script} (${Math.round(source.length / 1024)} KB), SITES → ${bucket}, APP_URL → ${appUrl}`);
if (apply) {
  const form = new FormData();
  form.append(
    "metadata",
    JSON.stringify({
      main_module: "worker.js",
      compatibility_date: "2026-01-01",
      bindings: [
        { type: "r2_bucket", name: "SITES", bucket_name: bucket },
        { type: "plain_text", name: "APP_URL", text: appUrl },
        { type: "plain_text", name: "BASE_DOMAIN", text: base },
      ],
    }),
  );
  form.append("worker.js", new Blob([source], { type: "application/javascript+module" }), "worker.js");
  const up = await cf("PUT", `/accounts/${account}/workers/scripts/${script}`, undefined, form);
  if (!up.ok) fail("upload worker", up);
}

// 3. DNS.
log("\n3. DNS");
const records = await all(`/zones/${zone.id}/dns_records`);
const routable = records.filter((r) => ["A", "AAAA", "CNAME"].includes(r.type));
const explicit = new Set(routable.filter((r) => !r.name.startsWith("*.")).map((r) => r.name));
const keep = new Set([new URL(appUrl).hostname]);
if (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID) {
  const v = (p) => fetch(`https://api.vercel.com${p}${p.includes("?") ? "&" : "?"}teamId=${process.env.VERCEL_TEAM_ID}`, { headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` } }).then((r) => r.json());
  const projects = (await v("/v9/projects?limit=100")).projects ?? [];
  for (const p of projects) for (const d of (await v(`/v9/projects/${p.id}/domains`)).domains ?? []) if (d.name.endsWith(`.${base}`) || d.name === base) keep.add(d.name);
} else log("  (VERCEL_TOKEN/VERCEL_TEAM_ID not set: only the app's own name is checked for Vercel)");
for (const name of keep) {
  if (explicit.has(name) || name === base) {
    log(`  ✓ ${name} has its own record (stays as it is)`);
    continue;
  }
  plan(`add ${name} CNAME cname.vercel-dns.com (DNS only) so it stays on Vercel`);
  if (apply) {
    const c = await cf("POST", `/zones/${zone.id}/dns_records`, { type: "CNAME", name, content: "cname.vercel-dns.com", proxied: false, ttl: 1, comment: "Kept on Vercel (cloudflare-setup)" });
    if (!c.ok) fail(`add ${name}`, c);
    explicit.add(name);
  }
}
const wildcard = routable.filter((r) => r.name === `*.${base}`);
if (!wildcard.length) {
  plan(`add *.${base} AAAA 100:: (proxied)`);
  if (apply) {
    const c = await cf("POST", `/zones/${zone.id}/dns_records`, { type: "AAAA", name: `*.${base}`, content: "100::", proxied: true, ttl: 1, comment: "Published sites (gojoline-sites Worker)" });
    if (!c.ok) fail("add wildcard", c);
  }
}
for (const r of wildcard) {
  if (r.proxied) log(`  ✓ *.${base} ${r.type} ${r.content} is proxied`);
  else {
    plan(`proxy *.${base} ${r.type} ${r.content} (orange cloud; the Worker answers)`);
    if (apply) {
      const c = await cf("PATCH", `/zones/${zone.id}/dns_records/${r.id}`, { proxied: true });
      if (!c.ok) fail("proxy wildcard", c);
    }
  }
}
if (explicit.has(target)) log(`  ✓ ${target} exists`);
else {
  plan(`add ${target} AAAA 100:: (proxied; customers' own domains point here)`);
  if (apply) {
    const c = await cf("POST", `/zones/${zone.id}/dns_records`, { type: "AAAA", name: target, content: "100::", proxied: true, ttl: 1, comment: "Customer domains target (gojoline-sites Worker)" });
    if (!c.ok) fail(`add ${target}`, c);
  }
}

// 4. Routes.
log("\n4. Worker routes");
const routes = await all(`/zones/${zone.id}/workers/routes`);
const want = [
  { pattern: `*.${base}/*`, script },
  { pattern: "*/*", script },
  ...[...new Set([base, ...explicit])].filter((n) => n !== target).map((n) => ({ pattern: `${n}/*`, script: null })),
];
for (const w of want) {
  const have = routes.find((r) => r.pattern === w.pattern);
  if (have && (have.script ?? null) === w.script) {
    log(`  ✓ ${w.pattern} → ${w.script ?? "(not the Worker)"}`);
    continue;
  }
  plan(`${have ? "change" : "add"} route ${w.pattern} → ${w.script ?? "(not the Worker)"}`);
  if (!apply) continue;
  const body = w.script ? { pattern: w.pattern, script: w.script } : { pattern: w.pattern };
  const r = have ? await cf("PUT", `/zones/${zone.id}/workers/routes/${have.id}`, body) : await cf("POST", `/zones/${zone.id}/workers/routes`, body);
  if (!r.ok) fail(`route ${w.pattern}`, r);
}

// 5. Customers' own domains.
log("\n5. Customers' own domains (Cloudflare for SaaS)");
const fo = await cf("GET", `/zones/${zone.id}/custom_hostnames/fallback_origin`);
if (fo.ok && fo.result?.origin === target) log(`  ✓ fallback origin is ${target} (${fo.result.status})`);
else {
  plan(`set fallback origin to ${target}`);
  if (apply) {
    const r = await cf("PUT", `/zones/${zone.id}/custom_hostnames/fallback_origin`, { origin: target });
    if (!r.ok) console.warn(`  ! Could not set it (${r.errors.map((e) => e.message).join("; ")}). Enable SSL/TLS → Custom Hostnames in the dashboard, then run again. Sites on *.${base} work without it.`);
  }
}

log(`\nDone${apply ? "" : " (dry run)"}. Sites publish to https://<name>.${base} once the app has R2_* and PUBLISH_BASE_DOMAIN=${base}.`);
