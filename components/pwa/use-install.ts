"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// One shared copy of the browser's install offer: the menu item and the pop-up use the same one
// (a prompt can be shown only once), and it is kept even if it arrives before they mount.
let deferred: InstallPrompt | null = null;
let listening = false;
const subscribers = new Set<() => void>();
const emit = () => subscribers.forEach((fn) => fn());

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  // An offer caught by the early script in app/[lang]/layout.tsx, before this code loaded.
  const early = (window as { __gojoInstall?: InstallPrompt }).__gojoInstall;
  if (early) {
    deferred = early;
    (window as { __gojoInstall?: InstallPrompt }).__gojoInstall = undefined;
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    (window as { __gojoInstall?: InstallPrompt }).__gojoInstall = undefined;
    emit();
  });
}

// Start listening as soon as this code loads, not only once a component mounts.
listen();

function subscribe(fn: () => void) {
  listen();
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Running as the installed app (home-screen icon), on Android, desktop or iPhone. */
export function isStandalone(): boolean {
  return matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** iPhone/iPad Safari, including iPadOS that reports itself as a Mac with touch. */
function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

/**
 * Whether and how this browser can install Gojoline: its own prompt (Android, desktop Chrome and
 * Edge) or the iPhone Safari steps. Everything is decided after the first paint, so the server
 * and the client render the same HTML.
 */
export function useInstall() {
  const prompt = useSyncExternalStore(subscribe, () => deferred, () => null);
  const [env, setEnv] = useState<{ ios: boolean; standalone: boolean } | null>(null);
  useEffect(() => {
    listen();
    const frame = requestAnimationFrame(() => setEnv({ ios: isIos(), standalone: isStandalone() }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const standalone = env?.standalone ?? false;
  return {
    /** Known once mounted; false on the server and during hydration. */
    ready: env !== null,
    standalone,
    canPrompt: !!prompt && !standalone,
    ios: !!env?.ios && !standalone,
    /** Shows the browser's prompt; null when there is none (iPhone shows its steps instead). */
    async install(): Promise<"accepted" | "dismissed" | null> {
      const p = deferred;
      if (!p) return null;
      // A prompt can be used once: forget it before it is answered.
      deferred = null;
      emit();
      await p.prompt();
      const choice = await p.userChoice.catch(() => ({ outcome: "dismissed" as const }));
      return choice.outcome;
    },
  };
}
