/** Object storage (Cloudflare R2 through its S3 API in production). Keys are plain paths. */
export interface StorageProvider {
  put(key: string, data: Buffer | string, opts?: { contentType?: string; cacheControl?: string }): Promise<void>;
  /** Null when the key doesn't exist. */
  get(key: string): Promise<Buffer | null>;
  /** Missing keys are not an error. */
  delete(key: string): Promise<void>;
  /** Deletes many keys in as few requests as the backend allows. */
  deleteMany(keys: string[]): Promise<void>;
  /** Keys under `prefix`; with a delimiter, deeper keys are grouped into `prefixes`. */
  list(prefix: string, opts?: { delimiter?: string }): Promise<{ keys: string[]; prefixes: string[] }>;
}
