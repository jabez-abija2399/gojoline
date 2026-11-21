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
}

export interface InviteResult {
  /** Owners who got a message. */
  sent: number;
  /** Owners we couldn't reach (phone only, no Telegram, or sending failed): asked on a later click. */
  unreachable: number;
}

/** At most this many owners per click, so a click stays quick and Telegram's limits are respected. */
export const INVITE_BATCH = 40;

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
  for (const [ownerId, sites] of byOwner) {
    if (sent >= INVITE_BATCH) break;
    const site = sites[0];
    const tg = deps.telegram ? await deps.telegram.store.byUser(ownerId).catch(() => null) : null;
    const locale = tg?.locale ?? "en";
    const link = `${deps.appUrl}/${locale}/dashboard/${site.projectId}?tab=settings#showcase`;
    const text = inviteText(site.name || site.url, link);
    let ok = false;
    if (tg && deps.telegram) {
      ok = await deps.telegram.client.sendMessage(tg.chatId, (locale === "am" ? text.am : text.en).map(escapeHtml).join("\n\n")).then(
        () => true,
        () => false,
      );
    }
    if (!ok && deps.email) {
      const contact = await deps.contactFor(ownerId).catch(() => null);
      if (contact?.email) {
        ok = await deps.email.send({ to: contact.email, subject: "Feature your website on Gojoline? · ድረ-ገጽዎን እናሳይ?", ...simpleEmail(text) }).then(
          () => true,
          () => false,
        );
      }
    }
    if (ok) {
      sent++;
      // Every site of this owner counts as asked: they get one question, not one per site.
      await deps.showcase.markInvited(sites.map((s) => s.siteId));
    } else unreachable++;
  }
  return { sent, unreachable };
}
