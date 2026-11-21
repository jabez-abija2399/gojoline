import { format, getMessages } from "@/lib/i18n";
import { simpleEmail, type EmailSender } from "@/lib/providers/notify/email";
import { escapeHtml, type TelegramClient } from "@/lib/telegram/client";
import type { TelegramStore } from "@/lib/telegram/store";
import type { InviteCandidate, ShowcaseStore } from "./showcase";

/**
 * "Invite owners to be featured" (Admin → Growth): asks owners of live sites that aren't in
 * Gojoline's posts whether they'd like to be. One short message per owner, once ever per site:
 * on Telegram when the owner linked it, else by email when they have a verified one. It only
 * points to the switch in their dashboard; nothing changes until the owner turns it on.
 */
export interface InviteDeps {
  showcase: ShowcaseStore;
  email: EmailSender | null;
  telegram: { store: TelegramStore; client: TelegramClient } | null;
  contactFor(userId: string): Promise<{ email: string | null } | null>;
  appUrl: string;
  /** One audit row per owner messaged (which sites, which channel). */
  audit?(entry: { ownerId: string; siteIds: string[]; channel: "telegram" | "email" }): Promise<void>;
}

export interface InviteResult {
  /** Owners who got a message. */
  sent: number;
  /** Owners we couldn't reach (phone only, no Telegram, or sending failed): asked on a later click. */
  unreachable: number;
}

/** At most this many messages, and owners tried, per click: a click stays quick and within Telegram's limits. */
export const INVITE_BATCH = 40;
const TRY_LIMIT = 100;

/** Telegram said the chat is gone (bot blocked, chat deleted): email is the way then. A timeout may have delivered. */
const telegramGone = (e: unknown) => /blocked|chat not found|deactivated|forbidden|kicked/i.test(e instanceof Error ? e.message : String(e));

/** The invitation in one language, from the i18n files (it quotes the dashboard switch's own label). */
export function inviteText(lang: "en" | "am", site: Pick<InviteCandidate, "name" | "url">, link: string): string[] {
  const t = getMessages(lang).growth.showcase;
  const first = site.name ? format(t.inviteNamed, { name: site.name, url: site.url }) : format(t.inviteUnnamed, { url: site.url });
  return [first, ...t.inviteBody.map((line) => format(line, { label: t.settingLabel, link }))];
}

/** Owners who can be invited now, and owners with no way to reach them yet (counted once each). */
export async function invitable(deps: Pick<InviteDeps, "showcase">): Promise<{ reachable: number; unreachable: number }> {
  const list = await deps.showcase.invitable(500);
  const reach = new Set(list.filter((c) => c.reachable).map((c) => c.ownerId));
  const rest = new Set(list.filter((c) => !c.reachable && !reach.has(c.ownerId)).map((c) => c.ownerId));
  return { reachable: reach.size, unreachable: rest.size };
}

export async function inviteOwners(deps: InviteDeps): Promise<InviteResult> {
  const candidates = (await deps.showcase.invitable(500)).filter((c) => c.reachable);
  // One message per owner per click, about their newest site (the list is newest first).
  const byOwner = new Map<string, InviteCandidate>();
  for (const c of candidates) if (!byOwner.has(c.ownerId)) byOwner.set(c.ownerId, c);
  let sent = 0;
  let unreachable = 0;
  let tried = 0;
  for (const [ownerId, site] of byOwner) {
    if (sent >= INVITE_BATCH || tried >= TRY_LIMIT) break;
    tried++;
    // Claimed before sending: a second click or a second admin running now can't ask the same owner again.
    // Only the site the message is about: another site of theirs can be asked about later.
    const claimed = await deps.showcase.claimInvite([site.siteId]);
    if (claimed.length === 0) continue;
    const channel = await send(deps, ownerId, site).catch(() => null);
    if (!channel) {
      await deps.showcase.releaseInvite(claimed);
      unreachable++;
      continue;
    }
    sent++;
    await deps.audit?.({ ownerId, siteIds: claimed, channel }).catch(() => undefined);
  }
  return { sent, unreachable };
}

/** Sends one owner's invitation; the channel used, or null when there is no way to reach them. */
async function send(deps: InviteDeps, ownerId: string, site: InviteCandidate): Promise<"telegram" | "email" | null> {
  const link = (lang: "en" | "am") => `${deps.appUrl}/${lang}/dashboard/${site.projectId}?tab=settings#showcase`;
  const tg = deps.telegram ? await deps.telegram.store.byUser(ownerId) : null;
  if (tg && deps.telegram) {
    try {
      await deps.telegram.client.sendMessage(tg.chatId, inviteText(tg.locale, site, link(tg.locale)).map(escapeHtml).join("\n\n"));
      return "telegram";
    } catch (e) {
      if (!telegramGone(e)) return null;
    }
  }
  if (!deps.email) return null;
  const contact = await deps.contactFor(ownerId);
  if (!contact?.email) return null;
  // Both languages, each with its own link; the site's language first in the subject.
  const subject = [getMessages(site.locale).growth.showcase.inviteSubject, getMessages(site.locale === "am" ? "en" : "am").growth.showcase.inviteSubject].join(" · ");
  await deps.email.send({ to: contact.email, subject, ...simpleEmail({ en: inviteText("en", site, link("en")), am: inviteText("am", site, link("am")) }) });
  return "email";
}
