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
