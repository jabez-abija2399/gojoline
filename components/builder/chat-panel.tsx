"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, CheckCircle2, Eye, ImagePlus, Loader2, PartyPopper, Sparkles, Undo2 } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/markdown";
import { format } from "@/lib/i18n/format";
import type { Messages } from "@/lib/i18n";
import { BuildTimeline, type Timeline } from "./build-timeline";
import { LanguageChoice, type SiteLanguages } from "./language-choice";
import { PHOTO_TYPES, type UploadResult } from "./use-photos";

export interface UiMessage {
  id: string;
  role: "owner" | "assistant";
  text: string;
  versionNumber?: number;
  tone?: "error";
  action?: { href: string; label: string };
  /** A version brought back (undo or restore): undoing that would redo the change. */
  restored?: boolean;
  /** What this AI answer used, e.g. "Used 2 changes · 18 left". */
  usage?: string;
}

interface Props {
  /** Building is paused: this notice replaces the welcome and the message box (nothing can be sent). */
  paused?: string;
  t: Messages["builder"];
  messages: UiMessage[];
  working: boolean;
  timeline: Timeline | null;
  /** Before the first build: which languages the site will have. */
  languages?: { value: SiteLanguages; onChange: (v: SiteLanguages) => void };
  onSend: (text: string) => void;
  /** First message: the general welcome, or what to do next with a template site. */
  welcome?: string;
  /** The site exists: offer next steps instead of starting ideas. */
  hasSite: boolean;
  /** The first version was just made in this visit. */
  celebrate: boolean;
  /** Phones: jump to the preview tab. */
  onSeeSite: () => void;
  /** Open the Photos view. */
  onPhotos: () => void;
  draft: string;
  onDraft: (text: string) => void;
  /** Changes when something else filled the message box and it should take focus. */
  focusKey: number;
  /** Add a photo straight from the chat box. */
  onAttach: (file: File) => Promise<UploadResult>;
  photoErrors: Record<string, string>;
  /** Takes back the newest change (free); absent when there is nothing earlier to go back to. */
  onUndo?: () => Promise<void>;
  /** AI changes left, and where to get more. Null while unknown. */
  credits: { left: number | null; href: string };
  /** A bigger request waiting for the owner's OK. */
  confirm?: { size: "medium" | "large"; cost: number; left: number; onGo: () => void; onSmaller: () => void; onDiscard: () => void };
  /** When the next monthly changes arrive, for the "no changes left" note. */
  nextGrant: string;
  /** Asked before sending; false keeps the message unsent (e.g. no changes left: the upgrade dialog opens). */
  onBeforeSend?: () => boolean;
}

const amharic = /[ሀ-፿]/;
const IDEAS = ["cafe", "shop", "clinic", "personal"] as const;
const NEXT = ["contact", "colours", "prices", "language"] as const;
const chip = "min-h-11 shrink-0 whitespace-nowrap rounded-full border border-line bg-white px-3.5 text-sm font-medium lg:min-h-9 text-ink transition-colors hover:border-faint hover:bg-sunken";

export function ChatPanel({ paused, t, messages, working, timeline, onSend, welcome, languages, hasSite, celebrate, onSeeSite, onPhotos, draft, onDraft: setDraft, focusKey, onAttach, photoErrors, onUndo, credits, confirm, nextGrant, onBeforeSend }: Props) {
  const [undoing, setUndoing] = useState(false);
  const [attach, setAttach] = useState<{ busy: boolean; note?: string; error?: string }>({ busy: false });
  const listRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const goRef = useRef<HTMLButtonElement>(null);
  // Shown once the run that asked has finished (the card is hidden while working).
  const waiting = !!confirm && !working;
  // The question about a bigger change takes focus, so it is read out and can be answered at once.
  useEffect(() => {
    if (waiting) goRef.current?.focus();
  }, [waiting]);
  const out = credits.left !== null && credits.left <= 0;

  useEffect(() => {
    // An empty chat starts at its top (the greeting); a conversation follows its newest line.
    if (messages.length > 0 || working) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, timeline?.steps.length, timeline?.sections.length, timeline?.edits, working, celebrate, hasSite]);

  useEffect(() => {
    if (focusKey > 0) boxRef.current?.focus();
  }, [focusKey]);

  const attachPhoto = async (file: File) => {
    if (attach.busy) return;
    setAttach({ busy: true });
    const result = await onAttach(file);
    if (result.ok) {
      const line = t.photoUseText.replace("{name}", result.photo.name);
      setDraft(draft.trim() ? `${draft.trimEnd()}\n${line}` : line);
      setAttach({ busy: false, note: t.photoAttached });
      boxRef.current?.focus();
    } else setAttach({ busy: false, error: photoErrors[result.error] ?? photoErrors.failed });
  };

  const submit = () => {
    const text = draft.trim();
    // A new message while a bigger request waits replaces it (the waiting one was never run).
    if (!text || working || paused) return;
    // Kept in the box: the owner can send it once they have changes again.
    if (onBeforeSend && !onBeforeSend()) return;
    // The waiting request is dropped from the chat (it was never run).
    confirm?.onDiscard();
    setDraft("");
    setAttach({ busy: false });
    onSend(text);
  };
  const fill = (text: string) => {
    setDraft(text);
    boxRef.current?.focus();
  };

  const fresh = !paused && messages.length === 0 && !welcome && !working && !hasSite;
  const lastId = messages.at(-1)?.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} role="log" tabIndex={0} aria-label={t.tabChat} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite" aria-relevant="additions">
        {fresh ? (
          <div className="m-auto flex w-full max-w-sm flex-col items-center gap-3 py-4 text-center">
            <Image src="/brand/mark.svg" alt="" width={56} height={56} className="size-12 sm:size-14" />
            <h2 className="text-lg font-semibold">{t.emptyTitle}</h2>
            <p className="text-ink-muted">{t.welcome}</p>
            <p id="chat-ideas" className="mt-2 flex items-center gap-2 text-sm font-medium text-ink-muted">
              <Sparkles aria-hidden="true" className="size-4 text-faint" />
              {t.ideasLabel}
            </p>
            <ul aria-labelledby="chat-ideas" className="flex flex-wrap justify-center gap-2">
              {IDEAS.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => fill(t.ideas[id].text)} className={chip}>
                    {t.ideas[id].label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Bubble role="assistant" label={t.assistant} text={paused ?? welcome ?? t.welcome} />
        )}
        {messages.map((m) => (
          <Bubble
            key={m.id}
            animate={m.id.startsWith("local-")}
            role={m.role}
            label={m.role === "owner" ? t.you : t.assistant}
            text={m.text}
            tone={m.tone}
            action={m.action}
            quietAction={out}
            note={m.versionNumber ? t.versionSaved.replace("{n}", String(m.versionNumber)) : undefined}
            usage={m.usage}
            seeSite={m.versionNumber && m.id === lastId && !working ? { label: t.seeSite, onClick: onSeeSite } : undefined}
            undo={
              onUndo && m.versionNumber && !m.restored && m.id === lastId && !working
                ? {
                    label: undoing ? t.undoing : t.undo,
                    busy: undoing,
                    onClick: async () => {
                      if (undoing) return;
                      setUndoing(true);
                      await onUndo().finally(() => setUndoing(false));
                    },
                  }
                : undefined
            }
          />
        ))}
        {celebrate && !working && (
          <div className="msg-in relative flex shrink-0 gap-3 overflow-hidden rounded-2xl border border-line bg-ink p-4 text-white">
            <Confetti />
            <PartyPopper aria-hidden="true" className="relative mt-0.5 size-6 shrink-0 text-coral" />
            <div className="relative flex flex-col gap-1">
              <p className="font-display text-base font-semibold">{t.readyTitle}</p>
              <p className="text-sunken">{t.readyBody}</p>
            </div>
          </div>
        )}
        {confirm && !working && (
          <div role="group" aria-labelledby="confirm-cost" className="msg-in flex max-w-[90%] flex-col gap-3 self-start rounded-2xl rounded-bl-sm border border-ink bg-white p-4">
            <p className="sr-only">{t.confirmLabel}</p>
            <p id="confirm-cost" className="font-medium">{format(confirm.size === "large" ? t.confirmLarge : t.confirmMedium, { n: confirm.cost })}</p>
            <p className="text-sm text-ink-muted">{format(t.confirmLeft, { left: confirm.left })}</p>
            <div className="flex flex-wrap gap-2">
              <button ref={goRef} type="button" onClick={confirm.onGo} className="inline-flex min-h-11 items-center rounded-lg bg-coral px-4 text-sm font-medium text-on-coral hover:bg-coral-hover lg:min-h-9">
                {t.confirmGo}
              </button>
              <button type="button" onClick={confirm.onSmaller} className="inline-flex min-h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:border-faint hover:bg-sunken lg:min-h-9">
                {t.confirmSmaller}
              </button>
            </div>
          </div>
        )}
        {working && timeline && <BuildTimeline t={t} timeline={timeline} />}
        {working && !timeline && (
          <p role="status" className="flex items-center gap-2 font-medium text-ink">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            {t.working}
          </p>
        )}
      </div>
      {/* With no changes left, the suggestions would only lead to "no changes": room for the note instead. */}
      {hasSite && !working && !out && !paused && (
        <div className="flex flex-col gap-2 border-t border-line bg-white pt-2 lg:pt-3">
          <p id="chat-next" className="flex items-center gap-2 px-4 text-sm font-medium text-ink-muted max-lg:sr-only">
            <Sparkles aria-hidden="true" className="size-4 text-faint" />
            {t.nextLabel}
          </p>
          <ul aria-labelledby="chat-next" className="chips-scroll flex gap-2 overflow-x-auto px-4 py-1.5">
            {NEXT.map((id) => (
              <li key={id} className="shrink-0">
                <button type="button" onClick={() => fill(t.next[id].text)} className={chip}>
                  {t.next[id].label}
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <button type="button" onClick={onPhotos} className={`${chip} inline-flex items-center gap-2`}>
                <ImagePlus aria-hidden="true" className="size-4" />
                {t.next.photos.label}
              </button>
            </li>
          </ul>
        </div>
      )}
      {languages && !paused && (
        <LanguageChoice
          title={t.langTitle}
          labels={{ en: t.langEn, am: t.langAm, both: t.langBothShort }}
          value={languages.value}
          onChange={languages.onChange}
          name="site-languages"
          className="border-t border-line bg-paper px-4 pt-3 pb-2"
        >
          <p className="text-sm text-ink-muted max-sm:hidden">{t.langHint}</p>
        </LanguageChoice>
      )}
      {credits.left !== null && credits.left <= 3 && !working && !confirm && !paused && (
        // Running low or out: say so before the next request, with where to get more.
        <div className={`flex gap-x-3 gap-y-2 border-t border-line bg-paper px-4 py-2 text-sm ${out ? "flex-col" : "items-center"}`}>
          <p className="flex min-w-0 flex-1 items-start gap-2">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <span className={out ? "" : "max-sm:line-clamp-2"}>
              {out ? format(t.zeroCredits, { date: nextGrant }) : credits.left === 1 ? t.lowCreditsOne : format(t.lowCredits, { n: credits.left })}
            </span>
          </p>
          {out ? (
            // Nothing else can be done here: buying more is this screen's one coral action.
            <Link href={credits.href} className="inline-flex min-h-11 items-center justify-center self-end rounded-lg bg-coral px-4 font-medium text-on-coral hover:bg-coral-hover">
              {t.zeroCreditsAction}
            </Link>
          ) : (
            <Link href={credits.href} className="inline-flex min-h-11 shrink-0 items-center font-semibold text-ink underline underline-offset-4 lg:min-h-9">
              {t.lowCreditsAction}
            </Link>
          )}
        </div>
      )}
      {paused ? (
        <p className="border-t border-line bg-paper px-4 py-3 text-sm text-ink-muted">{paused}</p>
      ) : (
      <form
        className="flex flex-col gap-1 bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          {t.chatLabel}
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-input bg-white p-1.5 shadow-sm has-[textarea:focus-visible]:outline has-[textarea:focus-visible]:outline-3 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-link">
          <label
            title={t.photoAttach}
            className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink transition-colors hover:bg-sunken has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-link ${attach.busy ? "opacity-60" : ""}`}
          >
            {attach.busy ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <ImagePlus aria-hidden="true" className="size-5" />}
            <span className="sr-only">{t.photoAttach}</span>
            <input
              type="file"
              accept={PHOTO_TYPES}
              className="sr-only"
              aria-disabled={attach.busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void attachPhoto(file);
              }}
            />
          </label>
          <textarea
            ref={boxRef}
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            maxLength={4000}
            placeholder={t.chatPlaceholder}
            className="max-h-40 min-h-12 flex-1 resize-none rounded-xl bg-transparent px-2.5 py-1.5 text-base [field-sizing:content] placeholder:text-ink-muted focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-disabled={working || !draft.trim()}
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition aria-disabled:opacity-50 not-aria-disabled:hover:scale-105 ${messages.at(-1)?.action || confirm || out ? "bg-ink text-white hover:bg-ink-hover" : "bg-coral text-on-coral hover:bg-coral-hover"}`}
          >
            {working ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : <ArrowUp aria-hidden="true" className="size-5" />}
            <span className="sr-only">{t.send}</span>
          </button>
        </div>
        <p role="status" className="px-2 text-sm text-ink empty:hidden">
          {attach.note}
        </p>
        {attach.error && (
          <p role="alert" className="px-2 text-sm text-destructive">
            {attach.error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 px-2 text-sm text-ink-muted">
          <span aria-hidden="true" className="hidden lg:block">
            {!attach.note && !attach.error && t.composerHint}
          </span>
          {credits.left !== null && (
            <Link href={credits.href} className={`-me-2 ms-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium underline-offset-4 hover:underline lg:min-h-9 ${credits.left <= 3 ? "text-warning" : "text-ink-muted"}`}>
              <Sparkles aria-hidden="true" className="size-3.5" />
              {credits.left <= 0 ? t.creditsNone : credits.left === 1 ? t.creditsLeftOne : t.creditsLeft.replace("{n}", String(credits.left))}
            </Link>
          )}
        </div>
      </form>
      )}
    </div>
  );
}

interface BubbleProps {
  role: "owner" | "assistant";
  label: string;
  text: string;
  note?: string;
  usage?: string;
  tone?: "error";
  action?: { href: string; label: string };
  /** Another coral button is on screen (no changes left): this link is drawn in ink. */
  quietAction?: boolean;
  seeSite?: { label: string; onClick: () => void };
  undo?: { label: string; busy: boolean; onClick: () => void };
  /** Only messages added in this visit ease in; saved history is simply there. */
  animate?: boolean;
}

function Bubble({ role, label, text, note, usage, tone, action, quietAction, seeSite, undo, animate }: BubbleProps) {
  const own = role === "owner";
  return (
    <div className={`${animate ? "msg-in " : ""}flex max-w-[90%] flex-col gap-1 ${own ? "items-end self-end" : "self-start"}`}>
      <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
        {!own && <Image src="/brand/mark.svg" alt="" width={20} height={20} className="size-5" />}
        {label}
      </span>
      {own ? (
        <p lang={amharic.test(text) ? "am" : "en"} className="whitespace-pre-wrap rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-white">
          {text}
        </p>
      ) : (
        // The AI's replies may use a little markdown (bold, lists); the owner's words stay as typed.
        <div
          lang={amharic.test(text) ? "am" : "en"}
          className={`rounded-2xl rounded-bl-sm px-4 py-3 ${tone === "error" ? "border border-destructive bg-coral-soft text-destructive" : "bg-paper text-ink"}`}
        >
          <ChatMarkdown text={text} />
        </div>
      )}
      {action && (
        <Link href={action.href} className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium lg:min-h-9 ${quietAction ? "bg-ink text-white hover:bg-ink-hover" : "bg-coral text-on-coral hover:bg-coral-hover"}`}>
          {action.label}
        </Link>
      )}
      {note && (
        <span className="flex items-center gap-1.5 text-sm text-ink-muted">
          <CheckCircle2 aria-hidden="true" className="size-4 text-faint" />
          {note}
        </span>
      )}
      {usage && (
        <span className="flex items-center gap-1.5 text-sm text-ink-muted">
          <Sparkles aria-hidden="true" className="size-4 text-faint" />
          {usage}
        </span>
      )}
      {(seeSite || undo) && (
        <div className="mt-1 flex flex-wrap gap-2">
          {seeSite && (
            <button type="button" onClick={seeSite.onClick} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink bg-white px-3.5 text-sm lg:min-h-9 font-medium text-ink hover:bg-sunken lg:hidden">
              <Eye aria-hidden="true" className="size-4" />
              {seeSite.label}
            </button>
          )}
          {undo && (
            <button type="button" aria-disabled={undo.busy} onClick={undo.onClick} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-sm lg:min-h-9 border border-line bg-white px-4 font-medium text-ink hover:border-faint hover:bg-sunken aria-disabled:opacity-60">
              {undo.busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Undo2 aria-hidden="true" className="size-4" />}
              {undo.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const PIECES = [
  ["34px", "-22px", "220deg", "bg-coral"],
  ["70px", "30px", "-160deg", "bg-sunken"],
  ["108px", "-16px", "140deg", "bg-coral"],
  ["140px", "44px", "-200deg", "bg-white"],
  ["176px", "-8px", "180deg", "bg-coral"],
  ["206px", "36px", "-120deg", "bg-faint"],
  ["238px", "4px", "260deg", "bg-white"],
  ["90px", "58px", "90deg", "bg-coral"],
] as const;

/** A small burst from the party icon: decoration only, hidden under reduced motion. */
function Confetti() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute start-7 top-7">
      {PIECES.map(([dx, dy, rot, color], i) => (
        <span key={i} className={`confetti-piece absolute size-2 rounded-[2px] ${color}`} style={{ "--dx": dx, "--dy": dy, "--rot": rot, animationDelay: `${i * 40}ms` } as React.CSSProperties} />
      ))}
    </span>
  );
}
