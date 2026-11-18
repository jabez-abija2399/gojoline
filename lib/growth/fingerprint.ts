import { createHmac } from "node:crypto";

/**
 * Keyed hashes of where an account was made, to spot an owner inviting themselves from the same
 * phone or computer. Never the address or user agent itself: an HMAC with a server secret, so the
 * values can't be reversed or compared outside Gojoline. IPv6 is cut to its /64 (one household or
 * phone), IPv4 kept whole.
 */
export function networkOf(ip: string): string | null {
  const v = ip.trim().toLowerCase();
  if (!v || v === "unknown") return null;
  if (!v.includes(":")) return v;
  const parts = v.split("::")[0]!.split(":");
  return `${parts.slice(0, 4).join(":")}::/64`;
}

export function signupHashes(input: { ip: string; userAgent: string | null }, secret: string): { ipHash: string | null; deviceHash: string | null } {
  const mac = (kind: string, v: string) => createHmac("sha256", `gojoline-signup:${secret}`).update(`${kind}:${v}`).digest("hex").slice(0, 32);
  const net = networkOf(input.ip);
  const ua = input.userAgent?.trim().slice(0, 300);
  return { ipHash: net ? mac("net", net) : null, deviceHash: ua ? mac("ua", ua) : null };
}
