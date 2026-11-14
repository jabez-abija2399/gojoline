/** A customer's own domain: a normal hostname that isn't ours or a hosting provider's. */
export function normalizeDomain(input: string): string | null {
  const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  if (d.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(d)) return null;
  if (/(^|\.)(gojoline\.(com|site)|vercel\.app|vercel\.run|localhost)$/.test(d)) return null;
  return d;
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
}

/** Where the domain must point. Apex domains use an A record, subdomains a CNAME. */
export function routingRecord(domain: string, apexName: string): DnsRecord {
  if (domain === apexName) return { type: "A", name: "@", value: "76.76.21.21" };
  return { type: "CNAME", name: domain.slice(0, -(apexName.length + 1)), value: "cname.vercel-dns.com" };
}
