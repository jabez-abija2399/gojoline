"use client";

import { useEffect, useRef, useState } from "react";
import { markInstallAnswered } from "./install-memory";
import { useInstall } from "./use-install";

/**
 * "Install the app": the browser's own install prompt on Android and desktop Chrome/Edge;
 * on iPhone (no prompt exists) it shows the two Safari steps. Hidden once installed.
 */
export function InstallApp({ t, className }: { t: { install: string; iosTitle: string; iosSteps: string; close: string }; className?: string }) {
  const { canPrompt, ios, install } = useInstall();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  if (!canPrompt && !ios) return null;
  const click = async () => {
    if (canPrompt) {
      // Answered here: the install pop-up doesn't ask again.
      if (await install()) markInstallAnswered();
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
