import "server-only";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SKIP_DIRS = new Set(["node_modules", "dist", "dist-ssr", "test", ".vite"]);
const BINARY = /\.(woff2?|png|jpe?g|webp|avif|ico)$/i;

export const TEMPLATE_ROOT = join(process.cwd(), "templates", "site");

export interface TemplateFile {
  path: string;
  content: string | Buffer;
}

/** All files of the site template (text and binary), relative to its root. */
export function templateFiles(root = TEMPLATE_ROOT): TemplateFile[] {
  const out: TemplateFile[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (!SKIP_DIRS.has(name)) walk(full);
        continue;
      }
      const path = relative(root, full).replace(/\\/g, "/");
      out.push({ path, content: BINARY.test(path) ? readFileSync(full) : readFileSync(full, "utf8") });
    }
  };
  walk(root);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Text files the agent can change (src/ and public/ text), used for versions. */
export function isVersionedPath(path: string): boolean {
  if (path.includes("..") || path.includes("\0") || path.startsWith("/") || path.length > 200) return false;
  return /^src\//.test(path) || (/^public\//.test(path) && /\.(svg|txt)$/.test(path));
}
