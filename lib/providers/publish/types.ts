import type { DnsRecord } from "@/lib/sites/domain";

export interface DomainStatus {
  /** active: verified and pointing at us; pending: waiting for DNS. */
  status: "active" | "pending";
  records: DnsRecord[];
}

export interface PublishFile {
  /** Path relative to the site root, e.g. "index.html", "assets/index-abc.js". */
  path: string;
  data: Buffer;
}

export interface PublishResult {
  url: string;
  deploymentId: string;
  providerProjectId: string;
}

/**
 * Hosts static sites on a domain separate from the builder. Cloudflare (R2 + Workers) on
 * `*.gojoline.site` is the target once credentials exist; Vercel on `*.vercel.app` until then.
 */
export interface PublishProvider {
  readonly name: string;
  /** Public address a slug will get (shown before publishing). */
  urlFor(slug: string): string;
  /**
   * Deploys the files. `providerProjectId` is the hosting project saved from an earlier publish;
   * without it a new project is created (and an existing one with the same name is never reused).
   */
  publish(input: { slug: string; files: PublishFile[]; headers: { key: string; value: string }[]; providerProjectId?: string | null }): Promise<PublishResult>;
  /** Attaches the owner's domain to the site and says which DNS records it needs. */
  addDomain(providerProjectId: string, domain: string): Promise<DomainStatus>;
  checkDomain(providerProjectId: string, domain: string): Promise<DomainStatus>;
  /** Detaches a domain from a site (used to release stale, never-verified claims). */
  removeDomain(providerProjectId: string, domain: string): Promise<void>;
}
