"use client";

import Link from "next/link";
import { savePresetChoice } from "@/components/builder/start-prompt";

/** A link to sign-in that remembers which real site was picked, so that template opens after. */
export function StartFromLink({ href, preset, className, children }: { href: string; preset: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={() => savePresetChoice(preset)} className={className}>
      {children}
    </Link>
  );
}
