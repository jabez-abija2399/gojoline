// Builds the Vercel Sandbox base snapshot: the site template with node_modules installed.
// Run after changing templates/site:  node --experimental-strip-types scripts/sandbox-snapshot.mts
// Then set SANDBOX_SNAPSHOT_ID to the printed id (Vercel project env + .env.local).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Sandbox } from "@vercel/sandbox";

const root = join(process.cwd(), "templates", "site");
const files: { path: string; content: Uint8Array }[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!["node_modules", "dist", "dist-ssr", "test"].includes(name)) walk(full);
    } else {
      files.push({ path: `/vercel/sandbox/site/${relative(root, full)}`, content: new Uint8Array(readFileSync(full)) });
    }
  }
};
walk(root);

const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing ${k}`);
  return v;
};
const sandbox = await Sandbox.create({
  teamId: env("VERCEL_TEAM_ID"),
  projectId: env("VERCEL_PROJECT_ID"),
  token: env("VERCEL_TOKEN"),
  runtime: "node22",
  resources: { vcpus: 2 },
  timeout: 10 * 60_000,
});
await sandbox.mkDir("/vercel/sandbox/site").catch(() => undefined);
await sandbox.writeFiles(files);
const install = await sandbox.runCommand({ cmd: "npm", args: ["ci", "--no-audit", "--no-fund"], cwd: "/vercel/sandbox/site" });
if (install.exitCode !== 0) throw new Error(await install.stderr());
const build = await sandbox.runCommand({ cmd: "npm", args: ["run", "build", "--silent"], cwd: "/vercel/sandbox/site" });
if (build.exitCode !== 0) throw new Error(await build.stderr());
const snapshot = await sandbox.snapshot({ expiration: 0 });
console.log(`SANDBOX_SNAPSHOT_ID=${snapshot.snapshotId}`);
