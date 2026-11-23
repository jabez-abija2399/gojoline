/**
 * Video renderer logic without I/O (tested in lib.test.ts): the frame timeline, the address
 * checks and the title cards' HTML. server.ts does the browser, image and ffmpeg work.
 */
import { isIP } from "node:net";

export const W = 1080;
export const H = 1920;
export const FPS = 30;
/** The phone window on the canvas: where the site scrolls. */
export const WINDOW = { x: 90, y: 250, w: 900, h: 1480, radius: 44 };

export type Style = "tour" | "spotlight" | "template";

export interface RenderRequest {
  url: string;
  style: Style;
  lang: "en" | "am";
  /** Texts written by the app (both languages live there). */
  text: { kicker: string; title: string; outroTitle: string; outroSub: string; site: string; footer: string };
}

/** One video second: what each frame shows. */
export type Shot = { kind: "card"; card: "intro" | "outro" } | { kind: "page"; y: number };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * The frames of a video, in order: the intro card, the page (scrolling top to bottom for a tour,
 * stopping at a few sections for a spotlight), then the closing card. `pageH` and `stops` are in
 * canvas pixels of the scaled screenshot; `y` is the top of the window's view.
 */
export function timeline(style: Style, pageH: number, stops: number[] = []): Shot[] {
  const out: Shot[] = [];
  const hold = (shot: Shot, seconds: number) => {
    for (let i = 0; i < Math.round(seconds * FPS); i++) out.push(shot);
  };
  const maxY = Math.max(0, pageH - WINDOW.h);
  const move = (from: number, to: number, seconds: number) => {
    const n = Math.round(seconds * FPS);
    for (let i = 1; i <= n; i++) out.push({ kind: "page", y: Math.round(from + (to - from) * ease(i / n)) });
  };
  hold({ kind: "card", card: "intro" }, style === "spotlight" ? 2.2 : 2.6);
  if (style === "spotlight" && stops.length > 0) {
    let y = 0;
    hold({ kind: "page", y: 0 }, 1.6);
    for (const stop of stops.slice(0, 3)) {
      const to = Math.min(maxY, Math.max(0, stop - 24));
      move(y, to, 0.9);
      hold({ kind: "page", y: to }, 2.4);
      y = to;
    }
  } else {
    hold({ kind: "page", y: 0 }, 1.6);
    // Long pages scroll a little faster, so every video stays about 20 seconds.
    move(0, maxY, Math.min(12, Math.max(5, maxY / 900)));
    hold({ kind: "page", y: maxY }, 1.2);
  }
  hold({ kind: "card", card: "outro" }, 3.4);
  return out;
}

/** Private, loopback, link-local (cloud metadata) and other non-public addresses. */
export function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (v === 6) {
    const x = ip.toLowerCase();
    if (x.startsWith("::ffff:")) return isPrivateAddress(x.slice(7));
    return x === "::1" || x === "::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb");
  }
  return true;
}

/** Only public https pages are filmed. */
export function allowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
    if (isIP(u.hostname) || !u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Brand paper and muted ink (brand/tokens.css). */
const PAPER = "#FBF9F6";
const MUTED = "#5F5A53";

/** The brand's fonts, embedded: Outfit for headings, Inter for text, Noto Sans Ethiopic for Amharic. */
export interface CardAssets {
  logo: string;
  outfit: string;
  ethiopic: string;
}

const baseCss = (a: CardAssets) =>
  `@font-face{font-family:Outfit;src:url(${a.outfit}) format("woff2");font-weight:100 900}@font-face{font-family:GojoEthiopic;src:url(${a.ethiopic}) format("woff2");font-weight:400 700}*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px}body{font-family:Inter,GojoEthiopic,"Noto Sans Ethiopic",sans-serif;background:${PAPER};color:#121212;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px}h1,b{font-family:Outfit,GojoEthiopic,"Noto Sans Ethiopic",sans-serif;font-weight:700}`;

/** The opening and closing cards, and the frame around the scrolling site, as HTML pages. */
export function cardHtml(card: "intro" | "outro" | "chrome", req: RenderRequest, assets: CardAssets): string {
  const t = req.text;
  const logo = assets.logo;
  const head = `<!doctype html><html lang="${req.lang}"><head><meta charset="utf-8"><style>${baseCss(assets)}`;
  if (card === "intro") {
    return `${head}.k{font-size:50px;font-weight:600;color:${MUTED};margin-bottom:36px}.t{font-size:104px;line-height:1.12;letter-spacing:-1px}.bar{width:96px;height:10px;border-radius:5px;background:#FF5B35;margin:56px auto 0}.logo{position:absolute;bottom:150px;width:380px}</style></head><body><p class="k">${esc(t.kicker)}</p><h1 class="t">${esc(t.title)}</h1><div class="bar"></div><img class="logo" src="${logo}" alt=""></body></html>`;
  }
  if (card === "outro") {
    return `${head}.logo{width:520px;margin-bottom:90px}.t{font-size:84px;line-height:1.15}.s{font-size:50px;color:${MUTED};margin-top:40px}.u{margin-top:90px;background:#FF5B35;color:#121212;font-size:48px;font-weight:700;padding:30px 64px;border-radius:999px}</style></head><body><img class="logo" src="${logo}" alt=""><h1 class="t">${esc(t.outroTitle)}</h1><p class="s">${esc(t.outroSub)}</p><p class="u">${esc(t.footer)}</p></body></html>`;
  }
  // The frame: a title above the window, a line below, and a transparent rounded window.
  const w = WINDOW;
  return `${head}body{background:transparent;padding:0;display:block}.top{position:absolute;top:0;left:0;right:0;height:${w.y}px;background:${PAPER};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:0 60px}.top b{font-size:56px;line-height:1.1;max-width:960px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.top span{font-size:46px;font-weight:600;color:${MUTED}}.bottom{position:absolute;left:0;right:0;top:${w.y + w.h}px;bottom:0;background:${PAPER};display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:600;color:${MUTED}}.win{position:absolute;left:${w.x - 1}px;top:${w.y - 1}px;width:${w.w + 2}px;height:${w.h + 2}px;border-radius:${w.radius}px;box-shadow:0 0 0 400px ${PAPER}, 0 0 0 2px #E9E4DC inset}</style></head><body><div class="win"></div><div class="top"><b>${esc(t.site)}</b><span>${esc(t.kicker)}</span></div><div class="bottom">${esc(t.footer)}</div></body></html>`;
}

/** Sections worth stopping at in a spotlight: the useful ones first (menu, prices, booking, map). */
export function pickStops(sections: { top: number; text: string }[], scale: number): number[] {
  const useful = /menu|price|book|reserv|contact|map|room|service|order|ምናሌ|ዋጋ|ቦታ|አገልግሎት|ያግኙን/i;
  const after = sections.filter((s) => s.top > 300);
  const ranked = [...after.filter((s) => useful.test(s.text)), ...after.filter((s) => !useful.test(s.text))];
  return [...new Set(ranked.slice(0, 3).map((s) => Math.round(s.top * scale)))].sort((a, b) => a - b);
}

/** Holiday greeting videos (Admin → Posts, holiday days): a drawn card, no web page involved. */
export const MOTIFS = ["meskel", "flowers", "star", "water", "dawn", "crescent", "mountains", "sparkle"] as const;
export type Motif = (typeof MOTIFS)[number];
export const GREETING_SECONDS = 8;

export interface GreetingRequest {
  lang: "en" | "am";
  motif: Motif;
  /** Written by the app: "Melkam Meskel!", one short line, and the web address. */
  text: { kicker: string; title: string; sub: string; footer: string };
}

/**
 * The illustration palette (docs/DECISIONS.md 2026-11-21): the brand's sun, coral and ink, plus
 * one water blue and one wood brown for the pictures that need them. Never green, yellow and red
 * together (brand/README.md).
 */
const SUN = "#FFD23F";
const SUN_DEEP = "#D99A00";
const CORAL = "#FF5B35";
const PANEL = "#FFFFFF";
const LINE = "#E9E4DC";
const INK = "#121212";
const WATER = "#2F80C9";
const WATER_LIGHT = "#8DC3EC";
const WOOD = "#8A5A2B";

const daisy = (x: number, y: number, r: number, spin: string) =>
  `<g transform="translate(${x} ${y})"><g style="transform:rotate(${spin});transform-box:fill-box;transform-origin:center">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.2}" ry="${r * 0.42}" fill="${SUN}" transform="rotate(${i * 30})"/>`).join("")}</g><circle r="${r * 0.28}" fill="${SUN_DEEP}"/></g>`;

const flame = (x: number, y: number, h: number) => `<path d="M${x} ${y - h} C${x + h * 0.45} ${y - h * 0.45} ${x + h * 0.42} ${y} ${x} ${y} C${x - h * 0.42} ${y} ${x - h * 0.45} ${y - h * 0.45} ${x} ${y - h}Z" fill="${CORAL}"/><path d="M${x} ${y - h * 0.55} C${x + h * 0.2} ${y - h * 0.3} ${x + h * 0.2} ${y} ${x} ${y} C${x - h * 0.2} ${y} ${x - h * 0.2} ${y - h * 0.3} ${x} ${y - h * 0.55}Z" fill="${SUN}"/>`;

/**
 * Each holiday's picture, as SVG in a 900×900 box. It is there from the first frame (which
 * networks use as the cover); `--e` (0→1, eased) only lets it settle.
 */
export function motifSvg(m: Motif): string {
  const grow = (i: number) => `style="transform:scale(calc(${0.9 + i * 0.02} + ${0.1 - i * 0.02} * var(--e)));transform-box:fill-box;transform-origin:center"`;
  const spin = "calc(var(--t) * 40deg)";
  const parts: Record<Motif, string> = {
    // Demera: the cone of poles topped by the cross (Meskel means cross), fire rising from the pile, Meskel daisies around.
    meskel: `<g ${grow(0)}>${[-150, -90, -30, 30, 90, 150].map((x) => `<line x1="${450 + x * 1.5}" y1="740" x2="${450 + x * 0.1}" y2="260" stroke="${WOOD}" stroke-width="20" stroke-linecap="round"/>`).join("")}<g fill="${INK}"><rect x="438" y="110" width="24" height="170" rx="8"/><rect x="390" y="150" width="120" height="24" rx="8"/></g>${flame(360, 740, 170)}${flame(450, 745, 230)}${flame(540, 740, 170)}</g><g ${grow(1)}>${daisy(130, 780, 90, spin)}${daisy(770, 780, 90, spin)}${daisy(450, 810, 62, spin)}</g>`,
    // Adey Abeba, the New Year's yellow daisies.
    flowers: `<g ${grow(0)}>${daisy(450, 420, 230, spin)}</g><g ${grow(1)}>${daisy(170, 690, 130, spin)}${daisy(730, 690, 130, spin)}</g><g ${grow(2)}>${daisy(250, 200, 80, spin)}${daisy(680, 180, 90, spin)}</g>`,
    // A star of eight points with a soft glow.
    star: `<g ${grow(0)}><circle cx="450" cy="450" r="330" fill="${SUN}" opacity=".18"/><circle cx="450" cy="450" r="220" fill="${SUN}" opacity=".22"/></g><g ${grow(1)}><path d="${Array.from({ length: 16 }, (_, i) => { const a = (Math.PI / 8) * i - Math.PI / 2; const r = i % 2 ? 140 : 300; return `${i ? "L" : "M"}${(450 + r * Math.cos(a)).toFixed(1)} ${(450 + r * Math.sin(a)).toFixed(1)}`; }).join(" ")}Z" fill="${SUN}" stroke="${SUN_DEEP}" stroke-width="8" stroke-linejoin="round" style="transform:rotate(calc((1 - var(--e)) * -30deg));transform-box:fill-box;transform-origin:center"/></g>`,
    // Water: waves and drops.
    water: `${[0, 1, 2].map((i) => `<path ${grow(i)} d="M60 ${520 + i * 110} q97.5 -70 195 0 t195 0 t195 0 t195 0" fill="none" stroke="${[WATER, WATER, WATER_LIGHT][i]}" stroke-width="34" stroke-linecap="round" opacity="${[1, 0.75, 1][i]}"/>`).join("")}<g ${grow(1)}>${[[300, 240, 60], [470, 160, 80], [640, 270, 55]].map(([x, y, r]) => `<path d="M${x} ${y - r * 1.6} C${x + r} ${y - r * 0.4} ${x + r} ${y + r} ${x} ${y + r} C${x - r} ${y + r} ${x - r} ${y - r * 0.4} ${x} ${y - r * 1.6}Z" fill="${WATER}"/>`).join("")}</g>`,
    // A sun rising at dawn.
    dawn: `<g ${grow(1)} style="transform:rotate(calc(var(--t) * 15deg));transform-box:fill-box;transform-origin:center">${Array.from({ length: 12 }, (_, i) => `<rect x="440" y="80" width="20" height="120" rx="10" fill="${SUN}" transform="rotate(${i * 30} 450 520)"/>`).join("")}</g><g ${grow(0)}><circle cx="450" cy="520" r="210" fill="${SUN}"/><circle cx="450" cy="520" r="210" fill="${CORAL}" opacity=".25"/></g><rect x="0" y="700" width="900" height="200" fill="${PAPER}"/><line x1="80" y1="700" x2="820" y2="700" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`,
    // A crescent moon and stars.
    crescent: `<g ${grow(0)}><circle cx="420" cy="450" r="290" fill="${SUN}"/><circle cx="530" cy="390" r="250" fill="${PAPER}"/></g><g ${grow(1)}>${[[690, 250, 40], [770, 460, 28], [730, 720, 30]].map(([x, y, r]) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3}Z" fill="${SUN}"/>`).join("")}</g>`,
    // The mountains of Adwa with the sun behind the ridge: remembrance, no flag.
    mountains: `<g ${grow(0)}><circle cx="560" cy="430" r="150" fill="${SUN}"/></g><g ${grow(1)}><path d="M40 760 L230 400 L330 540 L470 300 L620 560 L700 450 L860 760Z" fill="${INK}"/></g><line x1="40" y1="760" x2="860" y2="760" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`,
    // Confetti for the new year.
    sparkle: `<g ${grow(0)}>${Array.from({ length: 28 }, (_, i) => { const a = i * 2.39996; const r = 60 + (i * 13) % 330; const c = [CORAL, SUN, WATER, INK][i % 4]; return `<rect x="${(450 + r * Math.cos(a)).toFixed(0)}" y="${(450 + r * Math.sin(a)).toFixed(0)}" width="${18 + (i % 3) * 8}" height="${34 + (i % 4) * 8}" rx="6" fill="${c}" transform="rotate(${(i * 47) % 360} ${(450 + r * Math.cos(a)).toFixed(0)} ${(450 + r * Math.sin(a)).toFixed(0)})"/>`; }).join("")}</g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="600" height="600" overflow="visible" aria-hidden="true">${parts[m]}</svg>`;
}

/**
 * The greeting card at time `--t` (0→1). Everything sits in one column that ends above the
 * bottom fifth and keeps clear of the right edge (where Reels and TikTok put their captions and
 * buttons); long titles get a smaller size so nothing runs into the logo.
 */
export function greetingHtml(req: GreetingRequest, assets: CardAssets): string {
  const t = req.text;
  const words = (from: number) => `opacity:calc(min(1, max(0, (var(--t) - ${from}) * 6)));transform:translateY(calc(max(0, 1 - (var(--t) - ${from}) * 6) * 40px))`;
  const size = t.title.length > 26 ? 76 : t.title.length > 16 ? 92 : 108;
  return `<!doctype html><html lang="${req.lang}"><head><meta charset="utf-8"><style>${baseCss(assets)}:root{--t:0;--e:0}body{justify-content:flex-start;padding:120px 150px 0 90px}.m{width:600px;height:600px;flex:none}.k{font-size:44px;font-weight:600;color:${MUTED};margin-top:28px;${words(0.12)}}.t{font-size:${size}px;line-height:1.08;letter-spacing:-1px;margin-top:18px;max-width:840px;${words(0.18)}}.s{font-size:44px;line-height:1.3;color:${MUTED};margin-top:28px;max-width:800px;${words(0.26)}}.bar{width:96px;height:10px;border-radius:5px;background:${CORAL};margin:40px auto 0;flex:none;${words(0.3)}}.logo{width:300px;margin-top:64px}.u{font-size:34px;font-weight:600;color:${MUTED};margin-top:10px}</style></head><body><div class="m">${motifSvg(req.motif)}</div><p class="k">${esc(t.kicker)}</p><h1 class="t">${esc(t.title)}</h1><p class="s">${esc(t.sub)}</p><div class="bar"></div><img class="logo" src="${assets.logo}" alt=""><p class="u">${esc(t.footer)}</p></body></html>`;
}

/** Checks a greeting request from the app: a known picture, a language, short texts. */
export function parseGreeting(v: unknown): GreetingRequest | null {
  const r = v as Partial<GreetingRequest> | null;
  const t = r?.text as Record<string, unknown> | undefined;
  if (!r || !MOTIFS.includes(r.motif as Motif) || (r.lang !== "en" && r.lang !== "am") || !t) return null;
  if (!["kicker", "title", "sub", "footer"].every((k) => typeof t[k] === "string" && (t[k] as string).length <= 160)) return null;
  return { lang: r.lang, motif: r.motif as Motif, text: { kicker: t.kicker as string, title: t.title as string, sub: t.sub as string, footer: t.footer as string } };
}

/**
 * Text videos (Admin → Posts, 2026-11-22): a tip, myth, how-to or question told in a few lines
 * that appear one by one, for days without a page to film. No web page and no network.
 */
export interface StoryRequest {
  lang: "en" | "am";
  /** "Website tip", "Myth vs fact"… */
  kicker: string;
  /** The hook, on screen from the first frame (the networks' cover). */
  title: string;
  /** 1–4 short lines, shown one after another. */
  lines: string[];
  /** The closing ask, e.g. "Comment your business". */
  cta: string;
  footer: string;
}

export const STORY_FPS = 10;
const LINE_START = 1.6;
const LINE_GAP = 2.4;

/** When each part appears (seconds), how long the animation runs and the whole video's length. */
export function storyTiming(lines: number): { line: (i: number) => number; cta: number; animated: number; seconds: number } {
  const cta = LINE_START + lines * LINE_GAP + 0.4;
  return { line: (i) => LINE_START + i * LINE_GAP, cta, animated: cta + 0.8, seconds: Math.ceil(cta + 3.6) };
}

/** The text video at second `--s`: the hook stays, each line slides in on its turn, then the ask. */
export function storyHtml(req: StoryRequest, assets: CardAssets): string {
  const timing = storyTiming(req.lines.length);
  const show = (from: number) => `opacity:calc(min(1, max(0, (var(--s) - ${from}) * 3)));transform:translateY(calc(max(0, 1 - (var(--s) - ${from}) * 3) * 36px))`;
  const size = req.title.length > 90 ? 56 : req.title.length > 60 ? 64 : req.title.length > 34 ? 76 : 92;
  // Long lines get smaller type, so four of them and the hook always fit the safe area.
  const total = req.lines.reduce((n, l) => n + l.length, 0);
  const lineSize = total > 380 ? 34 : total > 260 ? 38 : total > 160 ? 42 : 46;
  const tight = total > 260;
  const lines = req.lines
    .map((l, i) => `<li style="${show(timing.line(i))}"><span class="n">${i + 1}</span><span class="l">${esc(l)}</span></li>`)
    .join("");
  return `<!doctype html><html lang="${req.lang}"><head><meta charset="utf-8"><style>${baseCss(assets)}:root{--s:0}body{justify-content:safe center;align-items:stretch;text-align:start;padding:${tight ? 110 : 150}px 150px 384px 90px}.k{align-self:flex-start;background:${CORAL};color:${INK};font-size:44px;font-weight:700;padding:12px 30px;border-radius:999px}.t{font-size:${size}px;line-height:1.08;letter-spacing:-1px;margin-top:34px}ul{list-style:none;padding:0;margin:${tight ? 36 : 56}px 0 0;display:flex;flex-direction:column;gap:${tight ? 16 : 26}px}li{display:flex;gap:26px;align-items:flex-start;background:${PANEL};border:2px solid ${LINE};border-radius:28px;padding:${tight ? "20px 26px" : "30px 32px"}}.n{flex:none;width:64px;height:64px;border-radius:50%;background:${INK};color:${PAPER};font:700 36px/64px Outfit,sans-serif;text-align:center}.l{font-size:${lineSize}px;line-height:1.3}.c{margin-top:${tight ? 36 : 56}px;align-self:flex-start;background:${INK};color:${PAPER};font-size:44px;font-weight:700;padding:24px 40px;border-radius:999px;${show(timing.cta)}}.f{margin-top:${tight ? 24 : 40}px;display:flex;align-items:center;gap:24px;${show(timing.cta)}}.f img{width:240px}.f span{font-size:32px;font-weight:600;color:${MUTED}}</style></head><body><p class="k">${esc(req.kicker)}</p><h1 class="t">${esc(req.title)}</h1><ul>${lines}</ul><p class="c">${esc(req.cta)}</p><div class="f"><img src="${assets.logo}" alt=""><span>${esc(req.footer)}</span></div></body></html>`;
}

/** Checks a text-video request from the app: a language, 1–4 lines, short texts. */
export function parseStory(v: unknown): StoryRequest | null {
  const r = v as Partial<StoryRequest> | null;
  const str = (x: unknown, max: number) => typeof x === "string" && x.trim().length > 0 && x.length <= max;
  if (!r || (r.lang !== "en" && r.lang !== "am")) return null;
  // The longest a story can be and still fit above the networks' caption area (measured).
  if (!str(r.kicker, 40) || !str(r.title, 100) || !str(r.cta, 60) || !str(r.footer, 80)) return null;
  if (!Array.isArray(r.lines) || r.lines.length < 1 || r.lines.length > 4 || !r.lines.every((l) => str(l, 120))) return null;
  return { lang: r.lang, kicker: r.kicker!, title: r.title!, lines: [...r.lines] as string[], cta: r.cta!, footer: r.footer! };
}
