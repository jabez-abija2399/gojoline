"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marks its block `data-inview` the first time it scrolls into view, so CSS can play the
 * block's entrance once (transforms and opacity only). Without script, or with reduced motion,
 * the CSS shows the finished state.
 */
export function InView({ children, className, as: Tag = "div", ...rest }: { children: React.ReactNode; className?: string; as?: "div" | "ul" | "li" | "section" } & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      // A part of it a little way into the screen is enough (a tall block may never be 30 % visible).
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // @ts-expect-error -- the ref fits each of the allowed tags
    <Tag ref={ref} data-inview={seen || undefined} data-animate className={className} {...rest}>
      {children}
    </Tag>
  );
}
