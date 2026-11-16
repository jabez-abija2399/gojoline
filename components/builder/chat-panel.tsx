"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, CheckCircle2, Eye, ImagePlus, Loader2, PartyPopper, Sparkles, Undo2 } from "lucide-react";
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
}

interface Props {
  t: Messages["builder"];
  messages: UiMessage[];
  working: boolean;
  timeline: Timeline | null;
  streamText: string;
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
}

const amharic = /[ሀ-፿]/;
const IDEAS = ["cafe", "shop", "clinic", "personal"] as const;
const NEXT = ["contact", "colours", "prices", "language"] as const;
const chip = "min-h-11 shrink-0 whitespace-nowrap rounded-full border border-line bg-white px-3.5 text-sm font-medium lg:min-h-9 text-ink transition-colors hover:border-faint hover:bg-sunken";

export function ChatPanel({ t, messages, working, timeline, streamText, onSend, welcome, languages, hasSite, celebrate, onSeeSite, onPhotos, draft, onDraft: setDraft, focusKey, onAttach, photoErrors, onUndo, credits }: Props) {
  const [undoing, setUndoing] = useState(false);
  const [attach, setAttach] = useState<{ busy: boolean; note?: string; error?: string }>({ busy: false });
  const listRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // An empty chat starts at its top (the greeting); a conversation follows its newest line.
    if (messages.length > 0 || working) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, streamText, working, celebrate, hasSite]);

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
    if (!text || working) return;
    setDraft("");
    setAttach({ busy: false });
    onSend(text);
  };
  const fill = (text: string) => {
    setDraft(text);
    boxRef.current?.focus();
  };

  const fresh = messages.length === 0 && !welcome && !working && !hasSite;
  const lastId = messages.at(-1)?.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} role="log" tabIndex={0} aria-label={t.tabChat} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite" aria-relevant="additions">
        {fresh ? (
          <div className="m-auto flex w-full max-w-sm flex-col items-center gap-3 py-4 text-center">
            <Image src="/brand/mark.svg" alt="" width={56} height={56} className="size-12 sm:size-14" />
            <h2 className="text-2xl font-bold">{t.emptyTitle}</h2>
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
          <Bubble role="assistant" label={t.assistant} text={welcome ?? t.welcome} />
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
            note={m.versionNumber ? t.versionSaved.replace("{n}", String(m.versionNumber)) : undefined}
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
              <p className="font-display text-lg font-bold">{t.readyTitle}</p>
              <p className="text-sunken">{t.readyBody}</p>
            </div>
          </div>
        )}
        {working && timeline && <BuildTimeline t={t} timeline={timeline} streamText={streamText} />}
        {working && !timeline && (
          <p role="status" className="flex items-center gap-2 font-medium text-ink">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            {t.working}
          </p>
        )}
      </div>
      {hasSite && !working && (
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
      {languages && (
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
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition aria-disabled:opacity-50 not-aria-disabled:hover:scale-105 ${messages.at(-1)?.action ? "bg-ink text-white hover:bg-ink-hover" : "bg-coral text-on-coral hover:bg-coral-hover"}`}
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
            <Link href={credits.href} className={`-me-2 ms-auto inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-medium underline-offset-4 hover:underline ${credits.left <= 3 ? "text-warning" : "text-ink-muted"}`}>
              <Sparkles aria-hidden="true" className="size-3.5" />
              {credits.left <= 0 ? t.creditsNone : credits.left === 1 ? t.creditsLeftOne : t.creditsLeft.replace("{n}", String(credits.left))}
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

interface BubbleProps {
  role: "owner" | "assistant";
  label: string;
  text: string;
  note?: string;
  tone?: "error";
  action?: { href: string; label: string };
  seeSite?: { label: string; onClick: () => void };
  undo?: { label: string; busy: boolean; onClick: () => void };
  /** Only messages added in this visit ease in; saved history is simply there. */
  animate?: boolean;
}

function Bubble({ role, label, text, note, tone, action, seeSite, undo, animate }: BubbleProps) {
  const own = role === "owner";
  return (
    <div className={`${animate ? "msg-in " : ""}flex max-w-[90%] flex-col gap-1 ${own ? "items-end self-end" : "self-start"}`}>
      <span className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
        {!own && <Image src="/brand/mark.svg" alt="" width={20} height={20} className="size-5" />}
        {label}
      </span>
      <p
        lang={amharic.test(text) ? "am" : "en"}
        className={`whitespace-pre-wrap rounded-2xl px-4 py-3 ${
          own ? "rounded-br-sm bg-ink text-white" : tone === "error" ? "rounded-bl-sm border border-destructive bg-coral-soft text-destructive" : "rounded-bl-sm bg-paper text-ink"
        }`}
      >
        {text}
      </p>
      {action && (
        <Link href={action.href} className="inline-flex min-h-11 items-center rounded-lg bg-coral px-4 font-medium text-on-coral hover:bg-coral-hover">
          {action.label}
        </Link>
      )}
      {note && (
        <span className="flex items-center gap-1.5 text-sm text-ink-muted">
          <CheckCircle2 aria-hidden="true" className="size-4 text-faint" />
          {note}
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
