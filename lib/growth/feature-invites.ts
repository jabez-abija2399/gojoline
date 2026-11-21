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

export function inviteText(name: string, link: string) {
  return {
    en: [`Your website "${name}" is live on Gojoline. Would you like us to feature it?`, `With your yes, we may show it in the Gojoline showcase and in our posts and short videos on Telegram, Facebook, Instagram, TikTok and YouTube. It's free and you can turn it off any time.`, `To say yes, open your site's Settings and turn on "Show my site in the Gojoline showcase and posts": ${link}`, `If not, there's nothing to do. We won't ask again.`],
    am: [`ድረ-ገጽዎ "${name}" በጎጆላይን ላይ ቀጥታ ነው። እንድናሳየው ይፈልጋሉ?`, `ከፈቀዱ፣ በጎጆላይን ማሳያ እና በቴሌግራም፣ ፌስቡክ፣ ኢንስታግራም፣ ቲክቶክና ዩቲዩብ ልጥፎቻችንና አጫጭር ቪዲዮዎቻችን ላይ ልናሳየው እንችላለን። በነጻ ነው፣ በማንኛውም ጊዜም ማጥፋት ይችላሉ።`, `ለመፍቀድ፣ የድረ-ገጽዎን ቅንብሮች ከፍተው "ድረ-ገጼን በጎጆላይን ማሳያ ገጽና ልጥፎች ላይ አሳይ"ን ያብሩ፦ ${link}`, `ካልፈለጉ ምንም ማድረግ አያስፈልግም። ዳግም አንጠይቅም።`],
  };
}

export async function invitable(deps: Pick<InviteDeps, "showcase">): Promise<number> {
  return new Set((await deps.showcase.invitable(500)).map((c) => c.ownerId)).size;
}

export async function inviteOwners(deps: InviteDeps): Promise<InviteResult> {
  const candidates = await deps.showcase.invitable(500);
  // One message per owner (their newest site), however many sites they have.
  const byOwner = new Map<string, InviteCandidate[]>();
  for (const c of candidates) byOwner.set(c.ownerId, [...(byOwner.get(c.ownerId) ?? []), c]);
  let sent = 0;
  let unreachable = 0;
  let tried = 0;
  for (const [ownerId, sites] of byOwner) {
    if (sent >= INVITE_BATCH || tried >= TRY_LIMIT) break;
    tried++;
    // Claimed before sending: a second click or a second admin running now can't ask the same owner again.
    const claimed = await deps.showcase.claimInvite(sites.map((s) => s.siteId));
    if (claimed.length === 0) continue;
    const site = sites[0];
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
  const tg = deps.telegram ? await deps.telegram.store.byUser(ownerId) : null;
  const locale = tg?.locale ?? "en";
  const link = `${deps.appUrl}/${locale}/dashboard/${site.projectId}?tab=settings#showcase`;
  const text = inviteText(site.name || site.url, link);
  if (tg && deps.telegram) {
    try {
      await deps.telegram.client.sendMessage(tg.chatId, (locale === "am" ? text.am : text.en).map(escapeHtml).join("\n\n"));
      return "telegram";
    } catch (e) {
      if (!telegramGone(e)) return null;
    }
  }
  if (!deps.email) return null;
  const contact = await deps.contactFor(ownerId);
  if (!contact?.email) return null;
  await deps.email.send({ to: contact.email, subject: "Feature your website on Gojoline? · ድረ-ገጽዎን እናሳይ?", ...simpleEmail(text) });
  return "email";
}
