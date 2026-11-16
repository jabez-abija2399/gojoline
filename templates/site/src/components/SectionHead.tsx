import type { ReactNode } from "react";
import { useSite } from "../lib/context";
import type { Text } from "../lib/types";
import { SectionTitle } from "./SectionTitle";

/** A section's small label, title and opening line, in the site's style. */
export function SectionHead({ eyebrow, heading, intro, center = false, children }: { eyebrow?: Text; heading: Text; intro?: Text; center?: boolean; children?: ReactNode }) {
  const { text } = useSite();
  return (
    <div className={`section-head flex flex-col gap-3 ${center ? "items-center text-center" : ""}`}>
      {eyebrow && <p className="eyebrow">{text(eyebrow)}</p>}
      <SectionTitle>{text(heading)}</SectionTitle>
      {intro && <p className="max-w-[60ch] text-lg text-muted">{text(intro)}</p>}
      {children}
    </div>
  );
}
