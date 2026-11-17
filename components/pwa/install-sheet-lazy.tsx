"use client";

import dynamic from "next/dynamic";
// Eager and tiny: starts listening for the browser's install offer before the pop-up's code loads.
import "./use-install";
import type { InstallSheetText } from "./install-sheet";

const Sheet = dynamic(() => import("./install-sheet").then((m) => m.InstallSheet), { ssr: false });

/** The install pop-up, loaded after the page: none of its code is in the first download. */
export function LazyInstallSheet(props: { t: InstallSheetText; busy?: boolean; largeOnly?: boolean }) {
  return <Sheet {...props} />;
}
