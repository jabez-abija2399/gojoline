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
      const to = Math.min(maxY, Math.max(0, stop - 80));
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

const BASE_CSS = `*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px}body{font-family:"Noto Sans","Noto Sans Ethiopic",sans-serif;background:#FAF8F4;color:#121212;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px}`;

/** The opening and closing cards, and the frame around the scrolling site, as HTML pages. */
export function cardHtml(card: "intro" | "outro" | "chrome", req: RenderRequest, logo: string): string {
  const t = req.text;
  const head = `<!doctype html><html lang="${req.lang}"><head><meta charset="utf-8"><style>${BASE_CSS}`;
  if (card === "intro") {
    return `${head}.k{font-size:44px;font-weight:600;color:#5F5A53;margin-bottom:36px}.t{font-size:104px;line-height:1.08;font-weight:800;letter-spacing:-1px}.bar{width:96px;height:10px;border-radius:5px;background:#FF5B35;margin:56px auto 0}.logo{position:absolute;bottom:150px;width:380px}</style></head><body><p class="k">${esc(t.kicker)}</p><h1 class="t">${esc(t.title)}</h1><div class="bar"></div><img class="logo" src="${logo}" alt=""></body></html>`;
  }
  if (card === "outro") {
    return `${head}.logo{width:520px;margin-bottom:90px}.t{font-size:84px;line-height:1.12;font-weight:800}.s{font-size:46px;color:#5F5A53;margin-top:40px}.u{margin-top:90px;background:#FF5B35;color:#121212;font-size:48px;font-weight:700;padding:30px 64px;border-radius:999px}</style></head><body><img class="logo" src="${logo}" alt=""><h1 class="t">${esc(t.outroTitle)}</h1><p class="s">${esc(t.outroSub)}</p><p class="u">${esc(t.footer)}</p></body></html>`;
  }
  // The frame: a title above the window, a line below, and a transparent rounded window.
  const w = WINDOW;
  return `${head}body{background:transparent;padding:0;display:block}.top{position:absolute;top:0;left:0;right:0;height:${w.y}px;background:#FAF8F4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}.top b{font-size:58px;font-weight:800;max-width:960px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.top span{font-size:34px;color:#5F5A53}.bottom{position:absolute;left:0;right:0;top:${w.y + w.h}px;bottom:0;background:#FAF8F4;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:600;color:#5F5A53}.win{position:absolute;left:${w.x - 1}px;top:${w.y - 1}px;width:${w.w + 2}px;height:${w.h + 2}px;border-radius:${w.radius}px;box-shadow:0 0 0 400px #FAF8F4, 0 0 0 2px #E9E4DC inset}</style></head><body><div class="win"></div><div class="top"><b>${esc(t.site)}</b><span>${esc(t.kicker)}</span></div><div class="bottom">${esc(t.footer)}</div></body></html>`;
}

/** Sections worth stopping at in a spotlight: the useful ones first (menu, prices, booking, map). */
export function pickStops(sections: { top: number; text: string }[], scale: number): number[] {
  const useful = /menu|price|book|reserv|contact|map|room|service|order|ምናሌ|ዋጋ|ቦታ|አገልግሎት|ያግኙን/i;
  const after = sections.filter((s) => s.top > 300);
  const ranked = [...after.filter((s) => useful.test(s.text)), ...after.filter((s) => !useful.test(s.text))];
  return [...new Set(ranked.slice(0, 3).map((s) => Math.round(s.top * scale)))].sort((a, b) => a - b);
}
