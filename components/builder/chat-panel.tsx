"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

export interface UiMessage {
  id: string;
  role: "owner" | "assistant";
  text: string;
  versionNumber?: number;
  tone?: "error";
  action?: { href: string; label: string };
}

interface Props {
  t: Messages["builder"];
  locale: Locale;
  messages: UiMessage[];
  working: boolean;
  stepLabel: string | null;
  streamText: string;
  onSend: (text: string) => void;
  /** First message: the general welcome, or what to do next with a template site. */
  welcome?: string;
}

const amharic = /[ሀ-፿]/;

export function ChatPanel({ t, messages, working, stepLabel, streamText, onSend, welcome }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, streamText, working]);

  const submit = () => {
    const text = draft.trim();
    if (!text || working) return;
    setDraft("");
    onSend(text);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} role="log" tabIndex={0} aria-label={t.tabChat} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite" aria-relevant="additions">
        <Bubble role="assistant" label={t.assistant} text={welcome ?? t.welcome} />
        {messages.map((m) => (
          <Bubble
            key={m.id}
            role={m.role}
            label={m.role === "owner" ? t.you : t.assistant}
            text={m.text}
            tone={m.tone}
            action={m.action}
            note={m.versionNumber ? t.versionSaved.replace("{n}", String(m.versionNumber)) : undefined}
          />
        ))}
        {working && (
          <div role="status" className="flex flex-col gap-2 rounded-2xl rounded-bl-sm bg-sand px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-teal">
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {stepLabel ?? t.working}
            </p>
            {streamText && <p className="whitespace-pre-wrap text-ink">{streamText}</p>}
          </div>
        )}
      </div>
      <form
        className="flex items-end gap-2 border-t border-line bg-white p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          {t.chatLabel}
        </label>
        <textarea
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
          className="min-h-12 flex-1 resize-none rounded-xl border border-input bg-white px-3 py-2 text-base placeholder:text-ink-muted"
        />
        <button
          type="submit"
          aria-disabled={working || !draft.trim()}
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-white aria-disabled:opacity-50 ${messages.at(-1)?.action ? "bg-teal hover:bg-teal-deep" : "bg-clay hover:bg-clay-hover"}`}
        >
          <ArrowUp aria-hidden="true" className="size-5" />
          <span className="sr-only">{t.send}</span>
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, label, text, note, tone, action }: { role: "owner" | "assistant"; label: string; text: string; note?: string; tone?: "error"; action?: { href: string; label: string } }) {
  const own = role === "owner";
  return (
    <div className={`flex max-w-[90%] flex-col gap-1 ${own ? "self-end items-end" : "self-start"}`}>
      <span className="text-sm font-semibold text-ink-muted">{label}</span>
      <p
        lang={amharic.test(text) ? "am" : "en"}
        className={`whitespace-pre-wrap rounded-2xl px-4 py-3 ${
          own ? "rounded-br-sm bg-teal text-white" : tone === "error" ? "rounded-bl-sm border border-destructive bg-clay-soft text-destructive" : "rounded-bl-sm bg-sand text-ink"
        }`}
      >
        {text}
      </p>
      {action && (
        <Link href={action.href} className="inline-flex min-h-11 items-center rounded-lg bg-clay px-4 font-medium text-white hover:bg-clay-hover">
          {action.label}
        </Link>
      )}
      {note && <span className="text-sm text-ink-muted">{note}</span>}
    </div>
  );
}
