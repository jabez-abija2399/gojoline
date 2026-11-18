"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import { Share, X } from "lucide-react";
import { shouldShowInstall, type InstallMemory } from "@/lib/pwa/install-rules";
import { countInstallVisit, GOOD_MOMENT_EVENT, markInstallAnswered, readInstallMemory, snoozeInstall } from "./install-memory";
import { useInstall } from "./use-install";

export interface InstallSheetText {
  sheetTitle: string;
  sheetBody: string;
  sheetTitleDesktop: string;
  sheetBodyDesktop: string;
  sheetInstall: string;
  sheetLater: string;
  sheetIosStep1: string;
  sheetIosStep2: string;
  sheetLabel: string;
  close: string;
}

/** Waits a moment after the page settles, so it never appears in the middle of loading. */
const SHOW_DELAY_MS = 1500;

/**
 * A friendly "add Gojoline to your phone" offer for signed-in owners: a bottom sheet on phones,
 * a card in the corner on large screens. Not modal: the page stays usable behind it.
 */
export function InstallSheet({ t, busy = false, largeOnly = false }: { t: InstallSheetText; busy?: boolean; largeOnly?: boolean }) {
  const { ready, standalone, canPrompt, ios, install } = useInstall();
  const [memory, setMemory] = useState<InstallMemory | null>(null);
  const [delayed, setDelayed] = useState(false);
  // When the page opened: a "Not now" from 14 days ago counts from here.
  const [openedAt, setOpenedAt] = useState(0);
  const [hidden, setHidden] = useState(false);
  // In the builder, phones keep the chat box and the celebration clear: offered on the next page instead.
  const [narrow, setNarrow] = useState(false);
  const titleId = useId();

  useEffect(() => {
    // Read after the first paint, and count this visit once.
    const frame = requestAnimationFrame(() => {
      setOpenedAt(Date.now());
      setNarrow(!matchMedia("(min-width: 1024px)").matches);
      setMemory(countInstallVisit());
    });
    const onMoment = () => setMemory(readInstallMemory());
    window.addEventListener(GOOD_MOMENT_EVENT, onMoment);
    const timer = setTimeout(() => setDelayed(true), SHOW_DELAY_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener(GOOD_MOMENT_EVENT, onMoment);
    };
  }, []);

  const show = ready && delayed && !hidden && !(largeOnly && narrow) && memory !== null && shouldShowInstall({ standalone, canPrompt, ios, busy, memory, now: openedAt });

  const later = useCallback(() => {
    setMemory(snoozeInstall());
    setHidden(true);
  }, []);
  // Escape puts it away from anywhere on the page (it isn't modal, so focus may be elsewhere).
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("dialog[open]") && later();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, later]);

  const go = async () => {
    setHidden(true);
    // Whatever the answer to the browser's own prompt, it isn't offered again.
    await install();
    setMemory(markInstallAnswered());
  };
  const [before, after] = t.sheetIosStep1.split("{icon}");

  // An always-present polite live region: the offer is announced when it appears, without taking focus.
  return (
    <div aria-live="polite">
      {show && (
        <aside
          aria-labelledby={titleId}
          className="msg-in fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 rounded-t-2xl border border-line bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-ink shadow-xl sm:inset-x-auto sm:end-4 sm:bottom-4 sm:w-96 sm:rounded-2xl sm:pb-4"
        >
          <div className="flex items-start gap-3">
            <Image src="/brand/icon-192.png" alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {/* A phone or a computer: said the way the owner will use it (fine pointer = mouse). */}
              <h2 id={titleId} className="font-display text-base font-semibold">
                <span className="pointer-fine:hidden">{t.sheetTitle}</span>
                <span className="hidden pointer-fine:inline">{t.sheetTitleDesktop}</span>
              </h2>
              <p className="text-ink-muted">
                <span className="pointer-fine:hidden">{t.sheetBody}</span>
                <span className="hidden pointer-fine:inline">{t.sheetBodyDesktop}</span>
              </p>
            </div>
            <button type="button" onClick={later} className="-me-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{t.close}</span>
            </button>
          </div>
          {!canPrompt && ios && (
            <ol className="flex list-decimal flex-col gap-1 rounded-xl bg-paper py-3 ps-8 pe-3 text-ink">
              <li>
                {before}
                <Share aria-hidden="true" className="mx-0.5 inline size-4 align-[-2px]" />
                {after}
              </li>
              <li>{t.sheetIosStep2}</li>
            </ol>
          )}
          <div className="flex flex-col-reverse gap-2 lg:flex-row lg:justify-end">
            <button type="button" onClick={later} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:border-faint hover:bg-sunken lg:min-h-9">
              {t.sheetLater}
            </button>
            {canPrompt && (
              <button type="button" onClick={go} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink-hover lg:min-h-9">
                {t.sheetInstall}
              </button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
