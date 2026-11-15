import "server-only";
import { routingRecord, type DnsRecord } from "@/lib/sites/domain";
import type { DomainStatus, PublishFile, PublishProvider, PublishResult } from "./types";

interface ProjectDomain {
  name?: string;
  apexName?: string;
  verified?: boolean;
  verification?: { type: string; domain: string; value: string }[];
  error?: { code?: string; message?: string };
}

const API = "https://api.vercel.com";

export interface VercelPublishConfig {
  token: string;
  teamId: string;
  /** Prefix for per-site Vercel projects: `${prefix}${slug}` → https://gojo-<slug>.vercel.app */
  projectPrefix?: string;
  fetchImpl?: typeof fetch;
}

/** One Vercel project per site, deployed as plain static files (no build on Vercel). */
export class VercelPublishProvider implements PublishProvider {
  readonly name = "vercel";
  private prefix: string;
  private fetch: typeof fetch;

  constructor(private config: VercelPublishConfig) {
    this.prefix = config.projectPrefix ?? "gojo-";
    this.fetch = config.fetchImpl ?? fetch;
  }

  urlFor(slug: string) {
    return `https://${this.prefix}${slug}.vercel.app`;
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T }> {
    const sep = path.includes("?") ? "&" : "?";
    const res = await this.fetch(`${API}${path}${sep}teamId=${encodeURIComponent(this.config.teamId)}`, {
      method,
      headers: { Authorization: `Bearer ${this.config.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { status: res.status, data };
  }

  /** Uses the saved project by ID, or creates a new one. Never adopts a project found by name. */
  private async ensureProject(name: string, savedId: string | null | undefined): Promise<string> {
    if (savedId) {
      const existing = await this.call<{ id?: string; name?: string }>("GET", `/v9/projects/${encodeURIComponent(savedId)}`);
      if (existing.status === 200 && existing.data.id === savedId) return savedId;
      throw new Error("Hosting project is missing");
    }
    // Published sites are public: no Vercel login wall in front of them.
    const created = await this.call<{ id?: string; error?: { code?: string; message?: string } }>("POST", "/v11/projects", {
      name,
      framework: null,
      ssoProtection: null,
    });
    if (created.status === 409 || created.data.error?.code === "conflict") throw new Error("slug_taken");
    if (!created.data.id) throw new Error(`Could not create hosting project (${created.status}): ${created.data.error?.message ?? ""}`);
    return created.data.id;
  }

  /** The address Vercel actually gave the project (it may differ if the name was taken). */
  private async productionUrl(projectId: string, name: string): Promise<string> {
    const domains = await this.call<{ domains?: { name: string }[] }>("GET", `/v9/projects/${encodeURIComponent(projectId)}/domains`);
    const names = (domains.data.domains ?? []).map((d) => d.name).filter((d) => d.endsWith(".vercel.app"));
    const chosen = names.find((d) => d === `${name}.vercel.app`) ?? names[0];
    if (!chosen) throw new Error("No public address assigned");
    return `https://${chosen}`;
  }

  private async domainStatus(projectId: string, domain: string, info: ProjectDomain): Promise<DomainStatus> {
    const apex = info.apexName ?? domain;
    const records: DnsRecord[] = [routingRecord(domain, apex)];
    for (const v of info.verification ?? []) {
      if (v.type === "TXT") records.push({ type: "TXT", name: v.domain.endsWith(`.${apex}`) ? v.domain.slice(0, -(apex.length + 1)) : v.domain, value: v.value });
    }
    if (!info.verified) return { status: "pending", records };
    const config = await this.call<{ misconfigured?: boolean }>("GET", `/v6/domains/${encodeURIComponent(domain)}/config?projectIdOrName=${encodeURIComponent(projectId)}`);
    return { status: config.data.misconfigured === false ? "active" : "pending", records };
  }

  async addDomain(projectId: string, domain: string): Promise<DomainStatus> {
    const added = await this.call<ProjectDomain>("POST", `/v10/projects/${encodeURIComponent(projectId)}/domains`, { name: domain });
    if (added.status === 409) throw new Error("domain_in_use");
    // 400 can mean "already on this project": fall through to reading it.
    const info = added.status < 300 ? added.data : (await this.call<ProjectDomain>("GET", `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`)).data;
    if (!info.name) throw new Error(`domain_failed:${added.data.error?.code ?? added.status}`);
    return this.domainStatus(projectId, domain, info);
  }

  async removeDomain(projectId: string, domain: string): Promise<void> {
    const res = await this.call("DELETE", `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`);
    if (res.status >= 300 && res.status !== 404) throw new Error(`domain_remove_failed:${res.status}`);
  }

  async checkDomain(projectId: string, domain: string): Promise<DomainStatus> {
    let info = (await this.call<ProjectDomain>("GET", `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`)).data;
    if (info.name && !info.verified) {
      const verify = await this.call<ProjectDomain>("POST", `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}/verify`);
      if (verify.data.name) info = verify.data;
    }
    if (!info.name) throw new Error("domain_missing");
    return this.domainStatus(projectId, domain, info);
  }

  async publish(input: { slug: string; files: PublishFile[]; headers: { key: string; value: string }[]; providerProjectId?: string | null }): Promise<PublishResult> {
    if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(input.slug)) throw new Error("Invalid slug");
    const name = `${this.prefix}${input.slug}`;
    const projectId = await this.ensureProject(name, input.providerProjectId);
    // Defence in depth: the scanner already refuses these; the host config is always ours.
    const safeFiles = input.files.filter((f) => !/^(?:vercel\.json|api\/|\.vercel\/|middleware\.)/i.test(f.path));
    const vercelJson = { cleanUrls: true, trailingSlash: false, headers: [{ source: "/(.*)", headers: input.headers }] };
    const files = [
      ...safeFiles.map((f) => ({ file: f.path, data: f.data.toString("base64"), encoding: "base64" })),
      { file: "vercel.json", data: Buffer.from(JSON.stringify(vercelJson)).toString("base64"), encoding: "base64" },
    ];
    const created = await this.call<{ id?: string; error?: { message?: string } }>("POST", "/v13/deployments?skipAutoDetectionConfirmation=1", {
      name,
      project: projectId,
      target: "production",
      files,
      projectSettings: { framework: null, buildCommand: null, installCommand: null, outputDirectory: null, devCommand: null },
    });
    const id = created.data.id;
    if (!id) throw new Error(`Publish failed (${created.status}): ${created.data.error?.message ?? ""}`);

    for (let i = 0; i < 60; i++) {
      const d = await this.call<{ readyState?: string; errorMessage?: string }>("GET", `/v13/deployments/${id}`);
      if (d.data.readyState === "READY") return { url: await this.productionUrl(projectId, name), deploymentId: id, providerProjectId: projectId };
      if (d.data.readyState === "ERROR" || d.data.readyState === "CANCELED") throw new Error(`Publish failed: ${d.data.errorMessage ?? d.data.readyState}`);
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error("Publish timed out");
  }
}
