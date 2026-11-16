"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import { THEMES, type Theme } from "@/lib/app/theme-shared";
import { applyTheme } from "@/lib/app/theme-client";

const ICONS = { light: Sun, dark: Moon, system: Monitor };

/** Light, dark or the device's choice: switches at once and is remembered for a year. */
export function ThemeSwitch({ initial, label, names }: { initial: Theme; label: string; names: Record<Theme, string> }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const router = useRouter();
  const labelId = useId();
  const choose = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
    // Pages kept for Back were drawn with the old choice: draw them again with the new one.
    router.refresh();
  };
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1">
      <span id={labelId} className="text-sm font-medium text-ink">
        {label}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex gap-0.5 rounded-lg bg-sunken p-0.5">
        {THEMES.map((v) => {
          const Icon = ICONS[v];
          return (
            <button key={v} type="button" aria-pressed={theme === v} title={names[v]} onClick={() => choose(v)} className="flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink aria-pressed:bg-ink aria-pressed:text-white lg:size-9">
              <Icon aria-hidden="true" className="size-4" />
              <span className="sr-only">{names[v]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
