import { createContext, useContext, type ReactNode } from "react";

/** 1 for the first section of a page that has no hero, so every page has exactly one h1. */
export const HeadingLevel = createContext<1 | 2>(2);

/** The title of one item in a section: h3 normally, h2 when the section's own title is the page's h1. */
export function ItemTitle({ children, className }: { children: ReactNode; className?: string }) {
  const Tag = useContext(HeadingLevel) === 1 ? "h2" : "h3";
  return <Tag className={`item-title ${className ?? ""}`}>{children}</Tag>;
}

export function SectionTitle({ children, className = "section-title" }: { children: ReactNode; className?: string }) {
  const Tag = useContext(HeadingLevel) === 1 ? "h1" : "h2";
  return <Tag className={className}>{children}</Tag>;
}
