"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A native modal dialog: focus moves in and back, Escape closes it, the page behind is inert.
 * Bottom sheet on phones, centred card on larger screens.
 */
export function Modal({ open, onClose, title, closeLabel, children, labelId }: { open: boolean; onClose: () => void; title: string; closeLabel: string; children: ReactNode; labelId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelId}
      onClose={onClose}
      onClick={(e) => {
        // A tap on the dimmed backdrop closes it.
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-ink/50 sm:m-auto sm:max-w-md sm:rounded-2xl"
    >
      {open && (
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={labelId} className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="-me-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink">
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{closeLabel}</span>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** Asks before something that can't be undone or that visitors will notice. */
export function Confirm({ open, onClose, onConfirm, title, body, confirmLabel, cancelLabel, closeLabel, danger = false, busy = false, labelId }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel: string; cancelLabel: string; closeLabel: string; danger?: boolean; busy?: boolean; labelId: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title} closeLabel={closeLabel} labelId={labelId}>
      <p className="text-ink-muted">{body}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium hover:bg-sunken">
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => !busy && onConfirm()}
          aria-disabled={busy || undefined}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold aria-disabled:opacity-60 ${danger ? "bg-danger text-white hover:opacity-90" : "bg-ink text-white hover:bg-ink-hover"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
