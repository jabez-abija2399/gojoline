import type { ArtName } from "../lib/types";
import { appScenes } from "./art-app";

/**
 * Small poster-style drawings in the site's own colours, shown where a photo will go.
 * They say what the business is (a jebena for a café, a dome for a mosque) so a new site
 * looks finished and specific before the owner adds photos. Decoration only.
 *
 * Every drawing sits in a 400 x 300 box and keeps its subject near the middle, because
 * the box is cropped to squares and wide strips.
 */
const P = "fill-primary";
const A = "fill-accent";
const W = "fill-surface";
const line = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

const sky = (
  <>
    <circle cx="318" cy="66" r="44" className={`${P} opacity-25`} />
    <path d="M0 236 Q100 204 200 228 T400 214 V300 H0Z" className={`${P} opacity-20`} />
  </>
);

const scenes: Partial<Record<ArtName, React.ReactNode>> = {
  // A jebena (clay coffee pot) with two small cups and steam.
  coffee: (
    <>
      <circle cx="306" cy="78" r="52" className={`${P} opacity-20`} />
      <path d="M40 238h320" className="stroke-accent opacity-30" strokeWidth="4" {...line} />
      <path d="M186 96h28l-5 44h-18z" className={A} />
      <path d="M178 90h44v10h-44z" className={A} />
      <circle cx="200" cy="186" r="52" className={A} />
      <path d="M154 170 114 128" className="stroke-accent" strokeWidth="11" {...line} />
      <path d="M246 160q34 8 28 40-4 20-28 22" className="stroke-accent" strokeWidth="9" {...line} />
      <path d="M172 232h56v8h-56z" className={A} />
      <circle cx="184" cy="170" r="12" className={`${W} opacity-25`} />
      <path d="M96 214h44l-6 24h-32z" className={P} />
      <path d="M270 214h44l-6 24h-32z" className={P} />
      <path d="M112 196q-8-10 0-20t0-20M292 196q-8-10 0-20t0-20" className="stroke-primary opacity-60" strokeWidth="4" {...line} />
    </>
  ),
  // A shared plate seen from above: injera with stews.
  food: (
    <>
      <circle cx="200" cy="150" r="118" className={`${P} opacity-15`} />
      <circle cx="200" cy="150" r="98" className={W} />
      <circle cx="200" cy="150" r="98" className={`${P} opacity-25`} />
      <circle cx="200" cy="150" r="30" className={A} />
      <circle cx="146" cy="118" r="20" className={P} />
      <circle cx="254" cy="118" r="20" className={`${A} opacity-70`} />
      <circle cx="146" cy="186" r="20" className={`${A} opacity-45`} />
      <circle cx="254" cy="186" r="20" className={`${P} opacity-70`} />
      <circle cx="200" cy="88" r="13" className={`${P} opacity-55`} />
      <circle cx="200" cy="212" r="13" className={`${A} opacity-60`} />
      <rect x="112" y="140" width="34" height="14" rx="7" className={W} transform="rotate(-62 129 147)" />
      <rect x="254" y="146" width="34" height="14" rx="7" className={W} transform="rotate(62 271 153)" />
      <path d="M40 60q14-10 28 0M332 244q14-10 28 0" className="stroke-primary opacity-50" strokeWidth="5" {...line} />
    </>
  ),
  // A lodge by the water.
  hotel: (
    <>
      {sky}
      <path d="M118 104h164v124H118z" className={A} />
      <path d="M104 96h192v14H104z" className={P} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => <rect key={`${r}-${c}`} x={134 + c * 36} y={122 + r * 30} width="20" height="18" rx="3" className={`${W} ${(r + c) % 3 === 0 ? "opacity-90" : "opacity-45"}`} />),
      )}
      <path d="M186 228v-30a14 14 0 0 1 28 0v30z" className={P} />
      <path d="M0 250q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0v50H0z" className={`${P} opacity-45`} />
      <path d="M30 274q20-8 40 0t40 0M250 278q20-8 40 0t40 0" className="stroke-surface opacity-70" strokeWidth="4" {...line} />
    </>
  ),
  // A made bed under a window.
  room: (
    <>
      <rect x="232" y="48" width="96" height="84" rx="8" className={`${P} opacity-25`} />
      <circle cx="296" cy="80" r="16" className={`${P} opacity-60`} />
      <path d="M280 48v84M232 90h96" className="stroke-surface opacity-70" strokeWidth="4" {...line} />
      <rect x="70" y="112" width="26" height="126" rx="8" className={A} />
      <rect x="84" y="168" width="246" height="50" rx="10" className={P} />
      <rect x="84" y="196" width="246" height="34" rx="6" className={A} />
      <rect x="104" y="148" width="74" height="32" rx="12" className={W} />
      <path d="M96 230v18M318 230v18" className="stroke-accent" strokeWidth="10" {...line} />
      <path d="M40 250h320" className="stroke-accent opacity-25" strokeWidth="4" {...line} />
    </>
  ),
  // Care: a cross and a heartbeat. The cross uses the accent colour, never the primary, so a
  // red theme can't turn it into the protected red cross emblem.
  clinic: (
    <>
      <circle cx="200" cy="150" r="112" className={`${P} opacity-15`} />
      <rect x="132" y="82" width="136" height="136" rx="28" className={W} />
      <path d="M182 108h36v24h24v36h-24v24h-36v-24h-24v-36h24z" className={A} />
      <path d="M36 150h70l16-30 20 60 16-30h30M242 150h30l14-26 18 52 14-26h46" className="stroke-primary" strokeWidth="6" {...line} />
      <circle cx="78" cy="76" r="10" className={`${A} opacity-40`} />
      <circle cx="326" cy="232" r="14" className={`${P} opacity-40`} />
    </>
  ),
  // An open book, a pencil, a star for good work.
  school: (
    <>
      <circle cx="96" cy="76" r="40" className={`${P} opacity-20`} />
      <path d="M200 112q-56-26-112-8v112q56-18 112 8z" className={W} />
      <path d="M200 112q56-26 112-8v112q-56-18-112 8z" className={`${P} opacity-30`} />
      <path d="M200 112v112" className="stroke-accent" strokeWidth="6" {...line} />
      <path d="M112 132q32-8 64 4M112 156q32-8 64 4M112 180q32-8 64 4" className="stroke-accent opacity-45" strokeWidth="5" {...line} />
      <path d="M224 136q32-12 64-4M224 160q32-12 64-4" className="stroke-accent opacity-60" strokeWidth="5" {...line} />
      <path d="M300 62l8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2z" className={P} />
      <path d="M92 250l150-14" className="stroke-primary" strokeWidth="12" {...line} />
      <path d="M242 236l22-2-18 12z" className={A} />
    </>
  ),
  // A dress with a woven band at the hem and neck (habesha kemis).
  fashion: (
    <>
      <circle cx="200" cy="150" r="118" className={`${P} opacity-15`} />
      <g transform="translate(34 34) scale(0.83)">
        <path d="M170 52h60" className="stroke-accent" strokeWidth="6" {...line} />
        <path d="M200 52v-14a10 10 0 1 0-10-10" className="stroke-accent" strokeWidth="5" {...line} />
        <path d="M172 62h56l44 34-18 24-24-16v32l34 108H136l34-108v-32l-24 16-18-24z" className={W} />
        <path d="M144 220h112l8 24H136z" className={P} />
        <path d="M150 232l10-8 10 8 10-8 10 8 10-8 10 8 10-8 10 8 10-8 10 8" className="stroke-surface" strokeWidth="3" {...line} />
        <path d="M192 62h16v96h-16z" className={`${P} opacity-80`} />
        <path d="M200 76l5 5-5 5-5-5zM200 100l5 5-5 5-5-5zM200 124l5 5-5 5-5-5z" className={W} />
      </g>
    </>
  ),
  // A bag, a tag and parcels.
  shopping: (
    <>
      <circle cx="96" cy="84" r="46" className={`${P} opacity-20`} />
      <path d="M40 244h320" className="stroke-accent opacity-25" strokeWidth="4" {...line} />
      <path d="M140 110h120l12 134H128z" className={P} />
      <path d="M170 124v-22a30 30 0 0 1 60 0v22" className="stroke-accent" strokeWidth="8" {...line} />
      <circle cx="170" cy="126" r="6" className={A} />
      <circle cx="230" cy="126" r="6" className={A} />
      <rect x="282" y="186" width="62" height="58" rx="6" className={A} />
      <path d="M313 186v58M282 212h62" className="stroke-surface opacity-60" strokeWidth="4" {...line} />
      <rect x="62" y="204" width="48" height="40" rx="6" className={`${A} opacity-55`} />
      <path d="M176 176l22 22 30-36" className="stroke-surface" strokeWidth="8" {...line} />
    </>
  ),
  // A church with arched windows and a cross.
  church: (
    <>
      {sky}
      <g transform="translate(20 34) scale(0.9)">
        <path d="M200 40v40M184 54h32" className="stroke-accent" strokeWidth="7" {...line} />
        <path d="M150 132l50-52 50 52v96H150z" className={A} />
        <path d="M96 164h54v64H96zM250 164h54v64h-54z" className={`${A} opacity-75`} />
        <path d="M184 228v-34a16 16 0 0 1 32 0v34z" className={P} />
        <path d="M190 150v-14a10 10 0 0 1 20 0v14z" className={W} />
        <path d="M112 206v-16a10 10 0 0 1 20 0v16zM268 206v-16a10 10 0 0 1 20 0v16z" className={`${W} opacity-80`} />
        <path d="M86 164h70M244 164h70" className="stroke-primary" strokeWidth="8" {...line} />
      </g>
    </>
  ),
  // A dome, a minaret and a crescent.
  mosque: (
    <>
      <path d="M0 236 Q100 204 200 228 T400 214 V300 H0Z" className={`${P} opacity-20`} />
      <path d="M324 52a26 26 0 1 0 22 40 20 20 0 1 1-22-40z" className={P} />
      <circle cx="270" cy="60" r="4" className={P} />
      <circle cx="356" cy="118" r="3" className={P} />
      <path d="M130 228v-58a70 70 0 0 1 140 0v58z" className={A} />
      <path d="M200 100V76" className="stroke-accent" strokeWidth="6" {...line} />
      <circle cx="200" cy="70" r="7" className={P} />
      <path d="M72 228V104h28v124z" className={`${A} opacity-80`} />
      <path d="M66 104h40l-20-40z" className={P} />
      <path d="M64 150h44" className="stroke-primary" strokeWidth="6" {...line} />
      <path d="M182 228v-36a18 18 0 0 1 36 0v36z" className={P} />
      <path d="M146 196v-14a9 9 0 0 1 18 0v14zM236 196v-14a9 9 0 0 1 18 0v14z" className={`${W} opacity-80`} />
      <path d="M118 228h164" className="stroke-primary" strokeWidth="8" {...line} />
    </>
  ),
  // Flags, lights and a stage.
  event: (
    <>
      <path d="M20 70q180 60 360 0" className="stroke-accent opacity-60" strokeWidth="3" {...line} />
      {[60, 110, 160, 210, 260, 310].map((x, i) => (
        <path key={x} d={`M${x} ${80 + Math.round(22 * Math.sin(((x - 20) / 360) * Math.PI))}l14 0-7 26z`} className={i % 2 ? A : P} />
      ))}
      <path d="M130 70l-56 170h112zM270 70l56 170H214z" className={`${P} opacity-20`} />
      <path d="M70 232h260v26H70z" className={A} />
      <circle cx="200" cy="170" r="20" className={P} />
      <path d="M172 232q0-36 28-36t28 36z" className={P} />
      <circle cx="112" cy="130" r="5" className={A} />
      <circle cx="296" cy="146" r="6" className={P} />
      <circle cx="252" cy="112" r="4" className={A} />
      <circle cx="148" cy="170" r="4" className={P} />
    </>
  ),
  // Three people standing together.
  people: (
    <>
      <circle cx="200" cy="150" r="118" className={`${P} opacity-15`} />
      <circle cx="122" cy="132" r="22" className={`${A} opacity-70`} />
      <path d="M80 240q0-70 42-70t42 70z" className={`${A} opacity-70`} />
      <circle cx="278" cy="132" r="22" className={`${P} opacity-80`} />
      <path d="M236 240q0-70 42-70t42 70z" className={`${P} opacity-80`} />
      <circle cx="200" cy="112" r="27" className={A} />
      <path d="M148 244q0-86 52-86t52 86z" className={A} />
      <path d="M200 196c-10-12-26-2-18 12 4 7 18 16 18 16s14-9 18-16c8-14-8-24-18-12z" className={W} />
    </>
  ),
  // Homes on a street.
  home: (
    <>
      {sky}
      <path d="M62 228V150l48-40 48 40v78z" className={`${A} opacity-75`} />
      <path d="M150 228V120l60-50 60 50v108z" className={A} />
      <path d="M262 228v-70l40-34 40 34v70z" className={P} />
      <path d="M196 228v-40h28v40z" className={P} />
      <rect x="168" y="136" width="24" height="24" rx="3" className={W} />
      <rect x="228" y="136" width="24" height="24" rx="3" className={`${W} opacity-60`} />
      <rect x="92" y="166" width="22" height="22" rx="3" className={`${W} opacity-70`} />
      <rect x="290" y="174" width="22" height="22" rx="3" className={`${W} opacity-80`} />
      <path d="M40 228h320" className="stroke-accent" strokeWidth="6" {...line} />
    </>
  ),
  // Highland peaks, a sun and a path.
  mountains: (
    <>
      <circle cx="300" cy="78" r="38" className={`${P} opacity-45`} />
      <path d="M0 230l80-96 50 52 70-106 78 110 50-46 72 86v70H0z" className={`${A} opacity-35`} />
      <path d="M0 250l96-80 60 44 84-88 70 78 40-30 50 50v66H0z" className={A} />
      <path d="M240 126l-22 24 22 4 20-8z" className={`${W} opacity-80`} />
      <path d="M0 300q120-60 200-34t200-26v60z" className={P} />
      <path d="M150 300q30-28 80-30t60-24" className="stroke-surface opacity-80" strokeWidth="5" strokeDasharray="10 10" {...line} />
      <path d="M96 78q8-8 16 0 8-8 16 0M150 56q7-7 14 0 7-7 14 0" className="stroke-accent opacity-60" strokeWidth="3" {...line} />
    </>
  ),
  // A portrait in an arch.
  portrait: (
    <>
      <path d="M110 260V140a90 90 0 0 1 180 0v120z" className={`${P} opacity-25`} />
      <circle cx="200" cy="128" r="40" className={A} />
      <path d="M124 260q0-92 76-92t76 92z" className={A} />
      <path d="M176 172l24 28 24-28" className="stroke-surface opacity-70" strokeWidth="5" {...line} />
      <circle cx="86" cy="74" r="12" className={`${P} opacity-50`} />
      <circle cx="322" cy="214" r="18" className={`${P} opacity-35`} />
    </>
  ),
  // Finished work, framed.
  work: (
    <>
      <rect x="70" y="70" width="150" height="116" rx="10" className={W} transform="rotate(-6 145 128)" />
      <rect x="82" y="82" width="126" height="92" rx="6" className={`${P} opacity-30`} transform="rotate(-6 145 128)" />
      <rect x="180" y="110" width="160" height="130" rx="10" className={W} transform="rotate(5 260 175)" />
      <rect x="192" y="122" width="136" height="106" rx="6" className={`${A} opacity-85`} transform="rotate(5 260 175)" />
      <circle cx="292" cy="150" r="14" className={`${P}`} transform="rotate(5 260 175)" />
      <path d="M196 226l44-48 30 30 22-20 36 38z" className={`${P} opacity-70`} transform="rotate(5 260 175)" />
      <circle cx="120" cy="230" r="16" className={`${P} opacity-40`} />
    </>
  ),
};

// Without a hint, a calm abstract composition; three kinds so a page of them isn't one shape repeated.
const abstracts = [
  <>
    <circle cx="320" cy="60" r="90" className={`${A} opacity-15`} />
    <circle cx="60" cy="260" r="120" className={`${P} opacity-15`} />
    <path d="M0 220 Q 100 170 200 210 T 400 190 V300 H0Z" className={`${P} opacity-20`} />
  </>,
  <>
    <path d="M60 300V170a70 70 0 0 1 140 0v130z" className={`${P} opacity-20`} />
    <path d="M200 300V120a70 70 0 0 1 140 0v180z" className={`${A} opacity-15`} />
    <circle cx="130" cy="92" r="26" className={`${P} opacity-30`} />
  </>,
  <>
    <rect x="40" y="40" width="150" height="110" rx="20" className={`${P} opacity-15`} />
    <rect x="210" y="40" width="150" height="220" rx="20" className={`${A} opacity-12`} />
    <rect x="40" y="170" width="150" height="90" rx="20" className={`${P} opacity-25`} />
    <circle cx="285" cy="150" r="42" className={`${P} opacity-25`} />
  </>,
];

/** A stable pick (same text, same drawing) so pages don't change between builds. */
function pick(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (h ^ (h >>> 7) ^ (h >>> 13)) % abstracts.length;
}

export function Art({ name, seed = "" }: { name?: ArtName; seed?: string }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      {(name && (scenes[name] ?? appScenes[name])) || abstracts[pick(seed)]}
    </svg>
  );
}
