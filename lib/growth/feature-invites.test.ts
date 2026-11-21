import { describe, expect, it } from "vitest";
import { MemoryEmailSender } from "@/lib/providers/notify/email";
import { MemoryTelegramClient } from "@/lib/telegram/client";
import { inviteOwners, invitable } from "./feature-invites";
import type { InviteCandidate, ShowcaseStore } from "./showcase";

function fakeShowcase(list: InviteCandidate[]) {
  const invited = new Set<string>();
  return {
    invited,
    store: {
      invitable: async (limit: number) => list.filter((c) => !invited.has(c.siteId)).slice(0, limit),
      claimInvite: async (ids: string[]) => {
        const fresh = ids.filter((id) => !invited.has(id));
        fresh.forEach((id) => invited.add(id));
        return fresh;
      },
      releaseInvite: async (ids: string[]) => void ids.forEach((id) => invited.delete(id)),
    } as unknown as ShowcaseStore,
  };
}

const site = (siteId: string, ownerId: string, name: string, more: Partial<InviteCandidate> = {}): InviteCandidate => ({ siteId, projectId: `p-${siteId}`, ownerId, name, url: `https://${siteId}.example`, locale: "en", reachable: true, ...more });

describe("feature invitations", () => {
  it("asks each owner once: Telegram in their language when linked, else email, else later", async () => {
    const sc = fakeShowcase([site("s1", "tg-user", "Selam"), site("s2", "tg-user", "Selam 2"), site("s3", "mail-user", "", { locale: "am" }), site("s4", "phone-user", "Lulit"), site("s5", "nobody", "Hana", { reachable: false })]);
    const client = new MemoryTelegramClient();
    const email = new MemoryEmailSender();
    const audits: { ownerId: string; siteIds: string[]; channel: string }[] = [];
    const deps = {
      showcase: sc.store,
      email,
      telegram: { client, store: { byUser: async (id: string) => (id === "tg-user" ? { chatId: "42", locale: "am" } : null) } as never },
      contactFor: async (id: string) => ({ email: id === "mail-user" ? "owner@example.com" : null }),
      appUrl: "https://gojoline.example",
      audit: async (e: { ownerId: string; siteIds: string[]; channel: string }) => void audits.push(e),
    };
    expect(await invitable(deps)).toEqual({ reachable: 3, unreachable: 1 });
    expect(await inviteOwners(deps)).toEqual({ sent: 2, unreachable: 1 });
    // Telegram: one message about the owner's newest site, in Amharic, quoting the real switch and linking to it.
    expect(client.sent).toHaveLength(1);
    expect(client.sent[0].chatId).toBe("42");
    expect(client.sent[0].html).toContain("«Selam» (https://s1.example)");
    expect(client.sent[0].html).toContain("ድረ-ገጼን በጎጆላይን ማሳያ ገጽና ልጥፎች ላይ አሳይ");
    expect(client.sent[0].html).toContain("https://gojoline.example/am/dashboard/p-s1?tab=settings#showcase");
    // Email: both languages, each with its own link; no published name, so the address is named.
    expect(email.sent.map((m) => m.to)).toEqual(["owner@example.com"]);
    expect(email.sent[0].subject).toBe("ድረ-ገጽዎን በጎጆላይን እናሳይ? · Feature your website on Gojoline?");
    expect(email.sent[0].text).toContain("Your website at https://s3.example is live");
    expect(email.sent[0].text).toContain("/en/dashboard/p-s3?tab=settings#showcase");
    expect(email.sent[0].text).toContain("/am/dashboard/p-s3?tab=settings#showcase");
    expect([...sc.invited].sort()).toEqual(["s1", "s3"]);
    expect(audits).toEqual([
      { ownerId: "tg-user", siteIds: ["s1"], channel: "telegram" },
      { ownerId: "mail-user", siteIds: ["s3"], channel: "email" },
    ]);
    // Nobody is asked twice about a site; a later click may ask about the owner's other site.
    expect(await inviteOwners(deps)).toEqual({ sent: 1, unreachable: 1 });
    expect(client.sent).toHaveLength(2);
    expect(client.sent[1].html).toContain("«Selam 2»");
    expect(await inviteOwners(deps)).toEqual({ sent: 0, unreachable: 1 });
  });

  it("never asks twice when two runs overlap, and doesn't email after a Telegram timeout", async () => {
    const sc = fakeShowcase([site("s1", "u", "Selam")]);
    const email = new MemoryEmailSender();
    let calls = 0;
    const client = { sendMessage: async () => { calls++; throw new Error("timeout"); } };
    const deps = { showcase: sc.store, email, telegram: { client, store: { byUser: async () => ({ chatId: "1", locale: "en" }) } } as never, contactFor: async () => ({ email: "o@example.com" }), appUrl: "https://x" };
    expect(await inviteOwners(deps)).toEqual({ sent: 0, unreachable: 1 });
    expect(email.sent).toEqual([]);
    expect(sc.invited.size).toBe(0); // released: tried again next time
    // Two runs at once: only one sends.
    const ok = new MemoryTelegramClient();
    const both = { ...deps, telegram: { client: ok, store: { byUser: async () => ({ chatId: "1", locale: "en" }) } } as never };
    const [a, b] = await Promise.all([inviteOwners(both), inviteOwners(both)]);
    expect(a.sent + b.sent).toBe(1);
    expect(ok.sent).toHaveLength(1);
    expect(calls).toBe(1);
  });

  it("keeps a site name from becoming Telegram markup", async () => {
    const sc = fakeShowcase([site("s1", "u", "<b>Bad</b> & Co")]);
    const client = new MemoryTelegramClient();
    await inviteOwners({ showcase: sc.store, email: null, telegram: { client, store: { byUser: async () => ({ chatId: "1", locale: "en" }) } as never }, contactFor: async () => null, appUrl: "https://x" });
    expect(client.sent[0].html).toContain("&lt;b&gt;Bad&lt;/b&gt; &amp; Co");
  });
});
