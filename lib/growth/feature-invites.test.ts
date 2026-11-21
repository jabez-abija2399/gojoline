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
      markInvited: async (ids: string[]) => void ids.forEach((id) => invited.add(id)),
    } as unknown as ShowcaseStore,
  };
}

const site = (siteId: string, ownerId: string, name: string): InviteCandidate => ({ siteId, projectId: `p-${siteId}`, ownerId, name, url: `https://${siteId}.example` });

describe("feature invitations", () => {
  it("asks each owner once: Telegram in their language when linked, else email, else later", async () => {
    const sc = fakeShowcase([site("s1", "tg-user", "Selam"), site("s2", "tg-user", "Selam 2"), site("s3", "mail-user", "Abebe"), site("s4", "phone-user", "Lulit")]);
    const client = new MemoryTelegramClient();
    const email = new MemoryEmailSender();
    const deps = {
      showcase: sc.store,
      email,
      telegram: { client, store: { byUser: async (id: string) => (id === "tg-user" ? { chatId: "42", locale: "am" } : null) } as never },
      contactFor: async (id: string) => ({ email: id === "mail-user" ? "owner@example.com" : null }),
      appUrl: "https://gojoline.example",
    };
    expect(await invitable(deps)).toBe(3);
    expect(await inviteOwners(deps)).toEqual({ sent: 2, unreachable: 1 });
    // Telegram: one message for both of the owner's sites, in Amharic, linking to the setting.
    expect(client.sent).toHaveLength(1);
    expect(client.sent[0].chatId).toBe("42");
    expect(client.sent[0].html).toContain("ድረ-ገጽዎ");
    expect(client.sent[0].html).toContain("https://gojoline.example/am/dashboard/p-s1?tab=settings#showcase");
    expect(email.sent.map((m) => m.to)).toEqual(["owner@example.com"]);
    expect([...sc.invited].sort()).toEqual(["s1", "s2", "s3"]);
    // Nobody is asked twice; the owner we couldn't reach is tried next time.
    expect(await inviteOwners(deps)).toEqual({ sent: 0, unreachable: 1 });
    expect(client.sent).toHaveLength(1);
  });

  it("keeps a site name from becoming Telegram markup", async () => {
    const sc = fakeShowcase([site("s1", "u", "<b>Bad</b> & Co")]);
    const client = new MemoryTelegramClient();
    await inviteOwners({ showcase: sc.store, email: null, telegram: { client, store: { byUser: async () => ({ chatId: "1", locale: "en" }) } as never }, contactFor: async () => null, appUrl: "https://x" });
    expect(client.sent[0].html).toContain("&lt;b&gt;Bad&lt;/b&gt; &amp; Co");
  });
});
