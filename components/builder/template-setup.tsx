"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { DesktopOutline, PhoneOutline } from "./build-placeholder";
import type { Device } from "./preview-panel";

const STEP_MS = 750;

/**
 * After starting from a template: the outline of a page with the template's own parts ticking off
 * one by one (its real sections, read from its site.json), while the real site loads underneath.
 * `onTicked` fires once every part is ticked; the panel fades this out when the site has loaded too.
 */
export function TemplateSetup({ t, device, sections, fading, onTicked, onSkip }: { t: Messages["builder"]; device: Device; sections: string[]; fading: boolean; onTicked: () => void; onSkip: () => void }) {
  const steps = [t.setupDesign, ...sections.map((s) => (t.tlSection as Record<string, string>)[s] ?? s), t.tlChecking];
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (done >= steps.length) {
      onTicked();
      return;
    }
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setDone((d) => d + 1), still ? STEP_MS / 3 : STEP_MS);
    return () => clearTimeout(id);
  }, [done, steps.length, onTicked]);
  const current = steps[Math.min(done, steps.length - 1)];

  return (
    <div
      data-testid="template-setup"
      role="group"
      aria-label={t.setupTitle}
      className={`absolute inset-0 z-10 flex flex-col overflow-hidden bg-white transition-opacity duration-500 ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <span aria-hidden="true" className="block h-1 shrink-0 bg-sunken">
        <span className="block h-full rounded-full bg-ink transition-[width] duration-700" style={{ width: `${Math.round((done / steps.length) * 100)}%` }} />
      </span>
      <div aria-hidden="true" className="min-h-0 flex-1 overflow-hidden">
        {device === "desktop" ? <DesktopOutline /> : <PhoneOutline />}
      </div>
      <div className="absolute inset-x-3 bottom-4 flex justify-center">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-4 shadow-lg">
          <p className="font-semibold text-ink">{t.setupTitle}</p>
          <p role="status" className="sr-only">{current}</p>
          <ol className="mt-3 flex flex-col gap-1.5 text-sm">
            {steps.map((label, i) => (
              <li key={`${i}-${label}`} className="flex items-center gap-2">
                <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full ${i < done ? "bg-lagoon text-white" : i === done ? "border border-ink" : "border border-dashed border-faint"}`}>
                  {i < done ? <Check className="size-3" strokeWidth={3} /> : i === done ? <Loader2 className="size-3 animate-spin" /> : null}
                </span>
                <span className={i === done ? "font-medium text-ink" : "text-ink-muted"}>{label}</span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={onSkip} className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-ink underline underline-offset-4 lg:min-h-9">
            {t.setupSkip}
          </button>
        </div>
      </div>
    </div>
  );
}
