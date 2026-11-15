"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { swapLocaleInPath, type Locale } from "@/lib/i18n/config";

interface Props {
  target: Locale;
  label: string;
  ariaLabel: string;
}

/** Link to the same page in the other language. A plain <a> so the server re-renders in that locale. */
export function LanguageSwitch({ target, label, ariaLabel }: Props) {
  const pathname = usePathname() ?? "/";
  const params = useSearchParams();
  // Keep the parts of the address that matter on the other side (where to go next, which site, which tab).
  const kept = new URLSearchParams();
  const next = params?.get("next");
  if (next && /^\/(en|am)\//.test(next)) kept.set("next", next.replace(/^\/(en|am)\//, `/${target}/`));
  for (const key of ["site", "tab"]) {
    const v = params?.get(key);
    if (v && v.length <= 300) kept.set(key, v);
  }
  const query = kept.size ? `?${kept.toString()}` : "";
  return (
    <a
      href={swapLocaleInPath(pathname, target) + query}
      hrefLang={target}
      lang={target}
      title={ariaLabel}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-base font-medium text-ink transition-colors hover:border-teal-mid hover:bg-teal-soft"
    >
      {label}
    </a>
  );
}
