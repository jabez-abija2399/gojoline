"use client";

import { useState } from "react";
import type { CreatorInfo, Privacy } from "@/lib/posts/tiktok-direct";

export interface TikTokFormText {
  account: string;
  caption: string;
  privacy: string;
  choose: string;
  privacyNames: Record<Privacy, string>;
  onlyMeNote: string;
  allow: string;
  comment: string;
  duet: string;
  stitch: string;
  turnedOff: string;
  maxLength: string;
  needAudience: string;
  newTab: string;
  disclose: string;
  discloseHelp: string;
  yourBrand: string;
  yourBrandHelp: string;
  branded: string;
  brandedHelp: string;
  pickOne: string;
  brandedPrivate: string;
  consent: string;
  consentBranded: string;
  music: string;
  policy: string;
  post: string;
  posting: string;
  cancel: string;
}

const MUSIC = "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en";
const POLICY = "https://www.tiktok.com/legal/page/global/bc-policy/en";

/**
 * TikTok's required posting screen (Direct Post guidelines): the account's name, a caption, the
 * audience chosen from TikTok's own options with no default, interactions off until turned on
 * (and greyed out when the account turned them off), commercial content disclosure, and the
 * consent line. Post stays disabled until the choices are complete.
 */
/** The account's picture isn't shown: the site's content policy only loads our own images. */
export function TikTokPostForm({ action, lang, postId, caption, creator, t, cancelHref }: { action: (f: FormData) => Promise<void>; lang: string; postId: string; caption: string; creator: CreatorInfo; t: TikTokFormText; cancelHref: string }) {
  const [privacy, setPrivacy] = useState<Privacy | "">("");
  const [disclose, setDisclose] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [branded, setBranded] = useState(false);
  const [pending, setPending] = useState(false);
  const brandedOn = disclose && branded;
  const needsKind = disclose && !yourBrand && !branded;
  const privateBranded = brandedOn && privacy === "SELF_ONLY";
  const ready = privacy !== "" && !needsKind && !privateBranded && !pending;
  const link = (href: string, text: string) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
      {text}
      <span className="sr-only"> {t.newTab}</span>
    </a>
  );
  const consent = (brandedOn ? t.consentBranded : t.consent).split(/(\{music\}|\{policy\})/).map((part, i) =>
    part === "{music}" ? <span key={i}>{link(MUSIC, t.music)}</span> : part === "{policy}" ? <span key={i}>{link(POLICY, t.policy)}</span> : <span key={i}>{part}</span>,
  );
  const box = "size-5 accent-[var(--color-ink)]";
  return (
    <form action={action} onSubmit={() => setPending(true)} className="flex max-w-2xl flex-col gap-4">
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="id" value={postId} />
      <p className="flex items-center gap-2">
        <span className="text-ink-muted">{t.account}</span>
        <span className="font-semibold">{creator.nickname || creator.username}</span>
        {creator.username && <span className="text-ink-muted">@{creator.username}</span>}
      </p>

      <p className="text-xs text-ink-muted">{t.maxLength.replace("{n}", String(creator.maxSeconds))}</p>
      <label className="flex flex-col gap-1">
        <span className="font-medium">{t.caption}</span>
        <textarea name="title" defaultValue={caption} maxLength={2200} rows={4} className="w-full rounded-lg border border-input bg-white p-3 text-base" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-medium">{t.privacy}</span>
        <select name="privacy" required value={privacy} onChange={(e) => setPrivacy(e.target.value as Privacy | "")} aria-invalid={privateBranded || undefined} aria-describedby="tt-privacy-note" className="min-h-11 w-full rounded-lg border border-input bg-white px-3 text-base">
          <option value="" disabled>
            {t.choose}
          </option>
          {creator.privacyOptions.map((o) => (
            <option key={o} value={o} disabled={o === "SELF_ONLY" && brandedOn}>
              {t.privacyNames[o]}
            </option>
          ))}
        </select>
        <span id="tt-privacy-note" aria-live="polite" className="text-sm text-ink-muted">
          {privateBranded ? t.brandedPrivate : creator.privacyOptions.length === 1 && creator.privacyOptions[0] === "SELF_ONLY" ? t.onlyMeNote : ""}
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">{t.allow}</legend>
        {(
          [
            ["comment", t.comment, creator.commentDisabled],
            ["duet", t.duet, creator.duetDisabled],
            ["stitch", t.stitch, creator.stitchDisabled],
          ] as const
        ).map(([name, label, off]) => (
          <label key={name} className={`flex min-h-11 items-center gap-3 pointer-fine:min-h-9 ${off ? "text-ink-muted" : ""}`}>
            <input type="checkbox" name={name} disabled={off} className={box} />
            {label}
            {off && <span className="text-sm">({t.turnedOff})</span>}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded-lg border border-line p-3">
        <legend className="px-1 font-medium">{t.disclose}</legend>
        <label className="flex min-h-11 items-center gap-3 pointer-fine:min-h-9">
          <input type="checkbox" name="disclose" checked={disclose} onChange={(e) => setDisclose(e.target.checked)} className={box} />
          {t.discloseHelp}
        </label>
        {disclose && (
          <div className="flex flex-col gap-2 ps-8">
            <label className="flex items-start gap-3">
              <input type="checkbox" name="yourBrand" checked={yourBrand} onChange={(e) => setYourBrand(e.target.checked)} aria-describedby="tt-kind" className={`${box} mt-0.5`} />
              <span>
                <span className="block font-medium">{t.yourBrand}</span>
                <span className="text-sm text-ink-muted">{t.yourBrandHelp}</span>
              </span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="branded" checked={branded} disabled={privacy === "SELF_ONLY"} onChange={(e) => setBranded(e.target.checked)} aria-describedby="tt-kind" className={`${box} mt-0.5`} />
              <span className={privacy === "SELF_ONLY" ? "text-ink-muted" : ""}>
                <span className="block font-medium">{t.branded}</span>
                <span className="text-sm text-ink-muted">{privacy === "SELF_ONLY" ? t.brandedPrivate : t.brandedHelp}</span>
              </span>
            </label>
            <p id="tt-kind" aria-live="polite" className="text-sm text-destructive">{needsKind ? t.pickOne : ""}</p>
          </div>
        )}
      </fieldset>

      <p className="text-sm text-ink-muted">{consent}</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={!ready} aria-describedby={privacy === "" ? "tt-need" : undefined} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-coral px-5 text-sm font-semibold text-on-coral hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-50 pointer-fine:min-h-9">
          {pending ? t.posting : t.post}
        </button>
        {privacy === "" && <span id="tt-need" className="text-sm text-ink-muted">{t.needAudience}</span>}
        <a href={cancelHref} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink pointer-fine:min-h-9">
          {t.cancel}
        </a>
      </div>
    </form>
  );
}
