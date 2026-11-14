import { createContext, useContext, type ReactNode } from "react";

/** 1 for the first section of a page that has no hero, so every page has exactly one h1. */
export const HeadingLevel = createContext<1 | 2>(2);

export function SectionTitle({ children, className = "section-title" }: { children: ReactNode; className?: string }) {
  const Tag = useContext(HeadingLevel) === 1 ? "h1" : "h2";
  return <Tag className={className}>{children}</Tag>;
}
