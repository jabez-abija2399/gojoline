"use client";

import { useEffect } from "react";

/** Phones: the tab row scrolls sideways; this keeps the current tab on screen. */
export function ActiveTabInView({ navId }: { navId: string }) {
  useEffect(() => {
    document.getElementById(navId)?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [navId]);
  return null;
}
