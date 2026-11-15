"use client";

import Image from "next/image";
import { useState } from "react";

interface Shot {
  src: string;
  width: number;
  height: number;
}

/**
 * A card's picture: the top of a real site. On a large screen with a mouse, resting on the
 * card loads the whole page and scrolls through it. The whole page is fetched only then, so
 * nobody downloads twelve long pictures just by opening the landing page.
 */
export function PanShot({ top, full, eager = false, first = false }: { top: Shot; full: Shot; /** In the first row: load at once, not lazily. */ eager?: boolean; /** The very first picture: the page's largest paint. */ first?: boolean }) {
  const [whole, setWhole] = useState(false);
  return (
    <span
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && matchMedia("(min-width: 1024px)").matches) setWhole(true);
      }}
      className="relative block aspect-[4/5] overflow-hidden border-b border-line bg-sunken after:absolute after:inset-x-0 after:bottom-0 after:h-10 after:bg-gradient-to-t after:from-white after:to-transparent"
    >
      <Image src={top.src} alt="" width={top.width} height={top.height} sizes="(min-width: 1024px) 256px, (min-width: 768px) 33vw, 50vw" {...(first ? { priority: true } : { loading: eager ? ("eager" as const) : ("lazy" as const) })} className="h-auto w-full" />
      {whole && (
        <Image
          src={full.src}
          alt=""
          width={full.width}
          height={full.height}
          sizes="256px"
          className="absolute inset-x-0 top-0 h-auto w-full transition-transform duration-[9s] ease-linear group-hover:translate-y-[calc(-100%+320px)] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        />
      )}
    </span>
  );
}
