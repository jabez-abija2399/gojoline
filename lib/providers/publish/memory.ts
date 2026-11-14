import { routingRecord } from "@/lib/sites/domain";
import type { DomainStatus, PublishFile, PublishProvider } from "./types";

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
  async checkDomain(_project: string, domain: string): Promise<DomainStatus> {
    return { status: this.domains.get(domain) ? "active" : "pending", records: [routingRecord(domain, domain.split(".").slice(-2).join("."))] };
  }
  async publish(input: { slug: string; files: PublishFile[] }) {
    this.published.set(input.slug, input.files);
    return { url: this.urlFor(input.slug), deploymentId: `dpl_${Date.now()}`, providerProjectId: `prj_${input.slug}` };
  }
}
