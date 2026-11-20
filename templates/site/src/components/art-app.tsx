import type { ArtName } from "../lib/types";

/**
 * Drawings of a software product in the site's own colours: a dashboard, a phone screen and a sales
 * chart. Decoration only (the words around them say what the product does). Kept apart from Art.tsx
 * so a site that never shows one is built without them (scripts/only-used-styles.ts). Parts carry
 * `app-*` classes the precise style animates gently.
 */
const S = "fill-surface";
const L = "fill-line";
const P = "fill-primary";
const T = "fill-text";
const M = "fill-muted";

/** A row of a list: a dot, a long and a short line, a value on the right. */
const row = (y: number, i: number, w = 120) => (
  <g key={y} className="app-row" style={{ "--i": i } as React.CSSProperties}>
    <circle cx="146" cy={y} r="5" className={i === 1 ? P : L} />
    <rect x="160" y={y - 4} width={w} height="7" rx="3.5" className={`${T} opacity-70`} />
    <rect x="160" y={y + 7} width={w * 0.55} height="5" rx="2.5" className={`${M} opacity-50`} />
    <rect x="322" y={y - 3} width="34" height="7" rx="3.5" className={i === 1 ? P : `${T} opacity-60`} />
  </g>
);

const bars = [48, 70, 56, 92, 74, 110, 88];

export const appScenes: Partial<Record<ArtName, React.ReactNode>> = {
  // A desktop app: title bar, sidebar, three figures, a bar chart and a list.
  dashboard: (
    <>
      <rect x="0" y="0" width="400" height="300" className={`${P} opacity-10`} />
      <rect x="22" y="22" width="356" height="256" rx="10" className={`${S} app-window`} />
      <rect x="22" y="22" width="356" height="22" rx="10" className={L} />
      <rect x="22" y="36" width="356" height="8" className={L} />
      {[38, 50, 62].map((x) => (
        <circle key={x} cx={x} cy="33" r="3.5" className={`${M} opacity-40`} />
      ))}
      <rect x="22" y="44" width="86" height="234" className={`${L} opacity-60`} />
      <rect x="34" y="58" width="44" height="8" rx="4" className={T} />
      {[80, 98, 116, 134, 152].map((y, i) => (
        <rect key={y} x="34" y={y} width={i === 0 ? 62 : 50 - i * 3} height="7" rx="3.5" className={i === 0 ? P : `${M} opacity-50`} />
      ))}
      {[120, 206, 292].map((x, i) => (
        <g key={x} className="app-tile" style={{ "--i": i } as React.CSSProperties}>
          <rect x={x} y="58" width="74" height="44" rx="6" className={i === 0 ? `${P} opacity-15` : `${L} opacity-70`} />
          <rect x={x + 9} y="68" width="30" height="5" rx="2.5" className={`${M} opacity-60`} />
          <rect x={x + 9} y="80" width={i === 0 ? 46 : 38} height="12" rx="3" className={i === 0 ? P : T} />
        </g>
      ))}
      <rect x="120" y="112" width="246" height="78" rx="6" className={`${L} opacity-40`} />
      {bars.map((h, i) => (
        <rect key={i} className={`app-bar ${i === 5 ? P : `${T} opacity-25`}`} style={{ "--i": i } as React.CSSProperties} x={134 + i * 33} y={182 - h * 0.6} width="18" height={h * 0.6} rx="3" />
      ))}
      {row(212, 0, 110)}
      {row(240, 1, 92)}
      {row(266, 2, 124)}
    </>
  ),
  // A phone with a receipt: a sale just made, paid by mobile money.
  mobile: (
    <>
      <circle cx="200" cy="150" r="128" className={`${P} opacity-10`} />
      <rect x="138" y="18" width="124" height="264" rx="22" className={T} />
      <rect x="145" y="26" width="110" height="248" rx="16" className={`${S} app-window`} />
      <rect x="182" y="32" width="36" height="7" rx="3.5" className={T} />
      <rect x="157" y="54" width="54" height="7" rx="3.5" className={`${M} opacity-60`} />
      <rect x="157" y="68" width="78" height="16" rx="4" className={T} />
      <g className="app-tick">
        <circle cx="200" cy="122" r="22" className={P} />
        <path d="M189 122l8 8 15-16" className="stroke-on-primary" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {[160, 178, 196, 214].map((y, i) => (
        <g key={y} className="app-row" style={{ "--i": i } as React.CSSProperties}>
          <rect x="157" y={y} width={60 - i * 6} height="6" rx="3" className={`${M} opacity-60`} />
          <rect x="223" y={y} width="20" height="6" rx="3" className={`${T} opacity-70`} />
        </g>
      ))}
      <rect x="157" y="238" width="86" height="22" rx="11" className={P} />
      <rect x="40" y="96" width="76" height="40" rx="8" className={`${S} app-tile`} style={{ "--i": 1 } as React.CSSProperties} />
      <rect x="50" y="106" width="34" height="6" rx="3" className={`${M} opacity-60`} />
      <rect x="50" y="118" width="54" height="9" rx="3" className={P} />
      <rect x="284" y="170" width="80" height="40" rx="8" className={`${S} app-tile`} style={{ "--i": 2 } as React.CSSProperties} />
      <rect x="294" y="180" width="40" height="6" rx="3" className={`${M} opacity-60`} />
      <rect x="294" y="192" width="58" height="9" rx="3" className={T} />
    </>
  ),
  // A sales chart: a line rising over a grid, with the latest point marked.
  chart: (
    <>
      <rect x="0" y="0" width="400" height="300" className={`${P} opacity-10`} />
      <rect x="30" y="30" width="340" height="240" rx="10" className={`${S} app-window`} />
      <rect x="50" y="50" width="70" height="8" rx="4" className={`${M} opacity-60`} />
      <rect x="50" y="66" width="110" height="18" rx="4" className={T} />
      <rect x="290" y="52" width="60" height="22" rx="11" className={`${P} opacity-15`} />
      <rect x="302" y="60" width="36" height="6" rx="3" className={P} />
      {[120, 160, 200, 240].map((y) => (
        <rect key={y} x="50" y={y} width="300" height="1.5" className={L} />
      ))}
      <path d="M50 228 L100 214 L150 220 L200 184 L250 192 L300 150 L346 122 L346 240 L50 240Z" className={`${P} opacity-15`} />
      <path className="app-line stroke-primary" d="M50 228 L100 214 L150 220 L200 184 L250 192 L300 150 L346 122" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      <circle cx="346" cy="122" r="9" className={`${P} app-dot`} />
      <circle cx="346" cy="122" r="4" className={S} />
    </>
  ),
};
