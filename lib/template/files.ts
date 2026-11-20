import "server-only";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { checkWritePath } from "@/lib/agent/workspace";

const SKIP_DIRS = new Set(["node_modules", "dist", "dist-ssr", "test", ".vite", "presets", "stock"]);
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

/** Files the agent may change; only these are saved in versions or restored into a sandbox. */
export function isVersionedPath(path: string): boolean {
  if (path.length > 200) return false;
  const check = checkWritePath(path);
  return check.ok && check.path === path;
}

/** Template files the agent may not change; re-written before every build. */
export function lockedTemplateFiles(root = TEMPLATE_ROOT): TemplateFile[] {
  return templateFiles(root).filter((f) => !isVersionedPath(f.path));
}

const STOCK_REF = /\/stock\/([a-z0-9-]+)\.webp/g;

/**
 * The sample photos a site uses (`/stock/<name>.webp` in its site.json), with their small
 * version and the wide version of hero photos. The library is large, so a sandbox gets only these, not the whole folder.
 */
export function stockFilesFor(siteJson: string): TemplateFile[] {
  const names = new Set<string>();
  for (const m of siteJson.matchAll(STOCK_REF)) names.add(m[1]!);
  const out: TemplateFile[] = [];
  // The cap is above the size of the library, so a valid site never loses a photo to it.
  for (const name of [...names].sort().slice(0, 400)) {
    for (const file of [`${name}.webp`, `${name}-320.webp`, `${name}-480.webp`, `${name}-1600.webp`]) {
      const content = libraryPhoto(file);
      if (content) out.push({ path: `public/stock/${file}`, content });
    }
  }
  return out;
}

const photos = new Map<string, Buffer | null>();

/** One file of the sample-photo library by file name (read once, then kept), or null. */
export function libraryPhoto(file: string): Buffer | null {
  if (!/^[a-z0-9-]+\.webp$/.test(file)) return null;
  let data = photos.get(file);
  if (data === undefined) {
    const full = join(TEMPLATE_ROOT, "public", "stock", file);
    data = existsSync(full) ? readFileSync(full) : null;
    photos.set(file, data);
  }
  return data;
}
