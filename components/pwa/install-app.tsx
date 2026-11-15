"use client";

import { useEffect, useRef, useState } from "react";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Install the app": the browser's own install prompt on Android and desktop Chrome/Edge;
 * on iPhone (no prompt exists) it shows the two Safari steps. Hidden once installed.
 */
export function InstallApp({ t, className }: { t: { install: string; iosTitle: string; iosSteps: string; close: string }; className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ua = navigator.userAgent;
    // iPhone/iPad Safari, including iPadOS that reports itself as a Mac with touch.
    // Decided after the first paint, so the server and client render the same HTML.
    const isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const frame = isIos ? requestAnimationFrame(() => setIos(true)) : 0;
    const onInstalled = () => setPrompt(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  if (!prompt && !ios) return null;
  const click = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice.catch(() => undefined);
      setPrompt(null);
    } else setOpen(true);
  };

  return (
    <>
      <button type="button" onClick={click} className={className}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <path d="M12 7v7m-3-3 3 3 3-3" />
        </svg>
        {t.install}
      </button>
      {ios && (
        <dialog ref={dialogRef} onClose={() => setOpen(false)} className="m-auto w-[min(92vw,26rem)] rounded-2xl p-6 backdrop:bg-ink/50">
          <h2 className="text-xl font-bold">{t.iosTitle}</h2>
          <p className="mt-3 whitespace-pre-line text-ink-muted">{t.iosSteps}</p>
          <form method="dialog" className="mt-5">
            <button className="min-h-11 rounded-lg bg-ink px-5 font-medium text-white">{t.close}</button>
          </form>
        </dialog>
      )}
    </>
  );
}
