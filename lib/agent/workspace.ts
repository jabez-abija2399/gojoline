/**
 * The files of one site project, wherever they live (Vercel Sandbox in production,
 * memory in tests, a local temp dir in evals). AI-generated code only ever runs inside
 * a workspace's own build, never in the builder's server process.
 */
export interface BuildResult {
  ok: boolean;
  /** Combined, trimmed output. On failure it holds the errors for the agent. */
  output: string;
  durationMs: number;
}

export interface Workspace {
  readFile(path: string): Promise<string | null>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  listFiles(): Promise<string[]>;
  /** Type check + validation + production build. */
  runBuild(): Promise<BuildResult>;
}

/** Editable surface for the agent. Everything else (package.json, configs, scripts) is locked. */
const EDITABLE = [/^src\/(?:[\w-]+\/)*[\w-]+\.(?:tsx?|css)$/, /^public\/(?:[\w-]+\/)*[\w.-]+\.(?:svg|webp|png|jpe?g|avif|ico|txt)$/];
const READABLE_EXTRA = [/^TEMPLATE\.md$/, /^index\.html$/, /^package\.json$/, /^vite\.config\.ts$/];
const LOCKED = [/^src\/lib\//, /^src\/(main|entry-server)\.tsx$/, /^src\/vite-env\.d\.ts$/];

export const MAX_FILE_BYTES = 200_000;

export type PathCheck = { ok: true; path: string } | { ok: false; reason: string };

export function normalizePath(raw: string): string {
  return raw.trim().replace(/^\.\//, "").replace(/\\/g, "/");
}

export function checkReadPath(raw: string): PathCheck {
  const path = normalizePath(raw);
  if (!path || path.includes("..") || path.startsWith("/") || path.includes("\0")) {
    return { ok: false, reason: "Path must be relative to the project root, without '..'" };
  }
  if ([...EDITABLE, ...READABLE_EXTRA].some((re) => re.test(path)) || LOCKED.some((re) => re.test(path))) {
    return { ok: true, path };
  }
  return { ok: false, reason: `Not allowed to read ${path}` };
}

export function checkWritePath(raw: string): PathCheck {
  const read = checkReadPath(raw);
  if (!read.ok) return read;
  if (LOCKED.some((re) => re.test(read.path))) {
    return { ok: false, reason: `${read.path} is part of the template core and can't be changed` };
  }
  if (!EDITABLE.some((re) => re.test(read.path))) {
    return { ok: false, reason: `Only files under src/ (ts, tsx, css) and public/ (images) can be changed` };
  }
  return read;
}

/** In-memory workspace for tests; `build` decides the outcome. */
export class MemoryWorkspace implements Workspace {
  readonly files: Map<string, string>;
  builds = 0;
  constructor(
    files: Record<string, string>,
    private build: (files: Map<string, string>) => { ok: boolean; output: string } = () => ({ ok: true, output: "" }),
  ) {
    this.files = new Map(Object.entries(files));
  }
  async readFile(path: string) {
    return this.files.get(path) ?? null;
  }
  async writeFile(path: string, content: string) {
    this.files.set(path, content);
  }
  async deleteFile(path: string) {
    this.files.delete(path);
  }
  async listFiles() {
    return [...this.files.keys()].sort();
  }
  async runBuild() {
    this.builds += 1;
    return { ...this.build(this.files), durationMs: 1 };
  }
}
