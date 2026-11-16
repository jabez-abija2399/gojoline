import type { StorageProvider } from "./types";

/** Tests and local development: objects kept in a Map. */
export class MemoryStorageProvider implements StorageProvider {
  readonly objects = new Map<string, { data: Buffer; contentType?: string; cacheControl?: string }>();

  async put(key: string, data: Buffer | string, opts: { contentType?: string; cacheControl?: string } = {}) {
    this.objects.set(key, { data: Buffer.from(data), ...opts });
  }
  async get(key: string) {
    return this.objects.get(key)?.data ?? null;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
  async deleteMany(keys: string[]) {
    for (const k of keys) this.objects.delete(k);
  }
  async list(prefix: string, opts: { delimiter?: string } = {}) {
    const keys: string[] = [];
    const prefixes = new Set<string>();
    for (const key of [...this.objects.keys()].sort()) {
      if (!key.startsWith(prefix)) continue;
      const rest = key.slice(prefix.length);
      const cut = opts.delimiter ? rest.indexOf(opts.delimiter) : -1;
      if (cut >= 0) prefixes.add(prefix + rest.slice(0, cut + opts.delimiter!.length));
      else keys.push(key);
    }
    return { keys, prefixes: [...prefixes] };
  }
}
