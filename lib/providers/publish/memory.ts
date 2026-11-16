import { routingRecord } from "@/lib/sites/domain";
import type { DomainStatus, PublishFile, PublishInput, PublishProvider } from "./types";

/** e2e/test stand-in: keeps the last published files per slug. */
export class MemoryPublishProvider implements PublishProvider {
  readonly name = "memory";
  readonly published = new Map<string, PublishFile[]>();
  urlFor(slug: string) {
    return `https://${slug}.sites.example`;
  }
  readonly domains = new Map<string, boolean>();
  async addDomain(_project: string, domain: string): Promise<DomainStatus> {
    this.domains.set(domain, false);
    return { status: "pending", records: [routingRecord(domain, domain.split(".").slice(-2).join("."))] };
  }
  readonly removedDomains: string[] = [];
  async removeDomain(_project: string, domain: string): Promise<void> {
    this.removedDomains.push(domain);
  }
  async checkDomain(_project: string, domain: string): Promise<DomainStatus> {
    return { status: this.domains.get(domain) ? "active" : "pending", records: [routingRecord(domain, domain.split(".").slice(-2).join("."))] };
  }
  readonly resting = new Set<string>();
  async setResting(providerProjectId: string, on: boolean) {
    if (on) this.resting.add(providerProjectId);
    else this.resting.delete(providerProjectId);
  }
  readonly redirects = new Map<string, string>();
  async publish(input: PublishInput) {
    this.published.set(input.slug, input.files);
    // A new deployment replaces the pointer, like Cloudflare's: the resting flag goes with it.
    this.resting.delete(`prj_${input.slug}`);
    if (input.redirectTo) this.redirects.set(input.slug, input.redirectTo);
    return { url: this.urlFor(input.slug), deploymentId: `dpl_${Date.now()}`, providerProjectId: `prj_${input.slug}` };
  }
}
