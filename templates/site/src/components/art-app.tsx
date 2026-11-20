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

/** Hairline borders that stay 1px however large the drawing is shown. */
const hair = { className: "stroke-line", fill: "none", strokeWidth: 1, vectorEffect: "non-scaling-stroke" } as const;
const num = (x: number, y: number, v: string, size: number, cls = T, anchor: "start" | "middle" | "end" = "start") => (
  <text x={x} y={y} fontSize={size} fontWeight={600} textAnchor={anchor} className={`${cls} app-num`}>
    {v}
  </text>
);

/** A row of the sales list: a thumbnail, a name line, a status for the newest, an amount. */
const row = (y: number, i: number, w: number, amount: string) => (
  <g key={y} className="app-row" style={{ "--i": i } as React.CSSProperties}>
    <rect x="112" y={y - 6} width="12" height="12" rx="3" className={L} />
    <rect x="130" y={y - 3.5} width={w} height="3.5" rx="1.75" className={`${T} opacity-70`} />
    <rect x="130" y={y + 2} width={w * 0.5} height="2.5" rx="1.25" className={`${M} opacity-50`} />
    {i === 0 && (
      <>
        <rect x="262" y={y - 5} width="34" height="10" rx="5" className={`${P} opacity-15`} />
        <circle cx="269" cy={y} r="2" className={P} />
        <rect x="274" y={y - 1.25} width="16" height="2.5" rx="1.25" className={P} />
      </>
    )}
    {num(372, y + 3, amount, 8, T, "end")}
  </g>
);

const bars = [46, 62, 52, 80, 66, 96, 74];

export const appScenes: Partial<Record<ArtName, React.ReactNode>> = {
  // A desktop app, framed to show whole in a wide crop: sidebar, three figures, a chart and the latest sales.
  dashboard: (
    <>
      <rect x="6" y="40" width="388" height="220" rx="8" className={`${S} app-window`} />
      <rect x="6" y="40" width="388" height="220" rx="8" {...hair} />
      {[16, 25, 34].map((x) => (
        <circle key={x} cx={x} cy="49" r="2.5" className={L} />
      ))}
      <path d="M6 58H394M96 58V260" {...hair} />
      <rect x="16" y="68" width="10" height="10" rx="3" className={P} />
      <rect x="31" y="71.5" width="34" height="3.5" rx="1.75" className={T} />
      <rect x="12" y="88" width="78" height="14" rx="3" className={`${P} opacity-10`} />
      {[95, 113, 131, 149].map((y, i) => (
        <g key={y}>
          <rect x="18" y={y - 3.5} width="7" height="7" rx="2" className={i === 0 ? P : `${M} opacity-40`} />
          <rect x="31" y={y - 1.75} width={i === 0 ? 40 : 34 - i * 3} height="3.5" rx="1.75" className={i === 0 ? P : `${M} opacity-50`} />
        </g>
      ))}
      {[
        ["48,250", "+12%"],
        ["312", ""],
        ["1,204", ""],
      ].map(([v, delta], i) => (
        <g key={v} className="app-tile" style={{ "--i": i } as React.CSSProperties}>
          <rect x={106 + i * 92} y="68" width="84" height="38" rx="5" className={S} />
          <rect x={106 + i * 92} y="68" width="84" height="38" rx="5" {...hair} />
          <rect x={114 + i * 92} y="76" width="28" height="3" rx="1.5" className={`${M} opacity-60`} />
          {num(114 + i * 92, 98, v!, 13, i === 0 ? P : T)}
          {delta && (
            <>
              <rect x={164} y="72" width="22" height="10" rx="5" className={`${P} opacity-15`} />
              {num(175, 79.5, delta, 6, P, "middle")}
            </>
          )}
        </g>
      ))}
      <rect x="106" y="114" width="268" height="78" rx="5" {...hair} />
      {[132, 150, 168].map((y) => (
        <path key={y} d={`M116 ${y}H364`} className="stroke-line" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      ))}
      <path d="M116 184H364" {...hair} />
      {bars.map((h, i) => (
        <rect key={i} className={`app-bar ${i === 5 ? P : L}`} style={{ "--i": i } as React.CSSProperties} x={124 + i * 34} y={184 - h * 0.6} width="12" height={h * 0.6} rx="2" />
      ))}
      <g className="app-tile" style={{ "--i": 3 } as React.CSSProperties}>
        <rect x="274" y="109" width="48" height="14" rx="4" className={T} />
        {num(298, 118.5, "9,840", 7, "fill-surface", "middle")}
      </g>
      {row(206, 0, 92, "1,250")}
      {row(225, 1, 74, "640")}
      {row(244, 2, 104, "2,380")}
    </>
  ),
  // A phone with a receipt: a sale just made, paid by mobile money.
  mobile: (
    <>
      <circle cx="200" cy="150" r="128" className={`${P} opacity-10`} />
      <rect x="138" y="18" width="124" height="264" rx="22" className={T} />
      <rect x="142" y="22" width="116" height="256" rx="18" className={`${S} app-window`} />
      <rect x="182" y="32" width="36" height="7" rx="3.5" className={T} />
      <rect x="157" y="54" width="54" height="7" rx="3.5" className={`${M} opacity-60`} />
      <rect x="157" y="68" width="78" height="16" rx="4" className={T} />
      <g className="app-tick">
        <circle cx="200" cy="112" r="14" className={P} />
        <path d="M193 112l5 5 9-10" className="stroke-on-primary" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {num(200, 145, "1,250", 15, T, "middle")}
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
      <rect x="30" y="30" width="340" height="240" rx="10" className={`${S} app-window`} />
      <rect x="50" y="50" width="70" height="8" rx="4" className={`${M} opacity-60`} />
      <rect x="50" y="66" width="110" height="18" rx="4" className={T} />
      <rect x="290" y="52" width="60" height="22" rx="11" className={`${P} opacity-15`} />
      <rect x="302" y="60" width="36" height="6" rx="3" className={P} />
      {[120, 160, 200, 240].map((y) => (
        <rect key={y} x="50" y={y} width="300" height="1.5" className={L} />
      ))}
      <path d="M50 228 L100 214 L150 220 L200 184 L250 192 L300 150 L346 122 L346 240 L50 240Z" className={`${P} opacity-15`} />
      <path className="app-line stroke-primary" d="M50 228 L100 214 L150 220 L200 184 L250 192 L300 150 L346 122" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
      <circle cx="346" cy="122" r="9" className={`${P} app-dot`} />
      <circle cx="346" cy="122" r="4" className={S} />
    </>
  ),
};
