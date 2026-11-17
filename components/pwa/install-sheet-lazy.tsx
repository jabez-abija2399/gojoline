"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
// Eager and tiny: starts listening for the browser's install offer before the pop-up's code loads.
import "./use-install";
import { countInstallVisit } from "./install-memory";
import type { InstallSheetText } from "./install-sheet";

const Sheet = dynamic(() => import("./install-sheet").then((m) => m.InstallSheet), { ssr: false });

/** The install pop-up, loaded after the page: none of its code is in the first download. */
export function LazyInstallSheet(props: { t: InstallSheetText; busy?: boolean; largeOnly?: boolean }) {
  // Count this visit as soon as the page runs, not when the pop-up's code arrives: on a slow
  // connection an owner can leave before it loads, and that visit must still count (once per session).
  useEffect(() => {
    countInstallVisit();
  }, []);
  return <Sheet {...props} />;
}
