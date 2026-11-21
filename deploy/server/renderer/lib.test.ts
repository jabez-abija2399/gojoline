import { describe, expect, it } from "vitest";
import { allowedUrl, cardHtml, FPS, greetingHtml, isPrivateAddress, MOTIFS, parseGreeting, pickStops, timeline, WINDOW, type GreetingRequest, type RenderRequest } from "./lib.ts";

const req: RenderRequest = { url: "https://gojoline.afridea.et/demo/cafe/", style: "tour", lang: "am", text: { kicker: "የዕለቱ <አብነት>", title: "ቦሌ ቡና ቤት", outroTitle: "ድረ-ገጽዎን በመጻፍ ይሥሩ።", outroSub: "በነጻ ይጀምሩ", site: "ቦሌ", footer: "gojoline.afridea.et" } };

describe("timeline", () => {
  it("a tour: intro, the page from top to bottom, then the closing card, about 20 seconds", () => {
    const shots = timeline("tour", 10_000);
    expect(shots[0]).toEqual({ kind: "card", card: "intro" });
    expect(shots.at(-1)).toEqual({ kind: "card", card: "outro" });
    const ys = shots.flatMap((s) => (s.kind === "page" ? [s.y] : []));
    expect(ys[0]).toBe(0);
    expect(Math.max(...ys)).toBe(10_000 - WINDOW.h);
    expect(ys.every((y, i) => i === 0 || y >= ys[i - 1])).toBe(true);
    expect(shots.length / FPS).toBeGreaterThan(15);
    expect(shots.length / FPS).toBeLessThan(23);
  });

  it("a spotlight stops at each section, and a short page never scrolls past its end", () => {
    const shots = timeline("spotlight", 6000, [1500, 3000, 9000]);
    const ys = new Set(shots.flatMap((s) => (s.kind === "page" ? [s.y] : [])));
    expect(ys.has(1476)).toBe(true);
    expect(ys.has(2976)).toBe(true);
    expect(ys.has(6000 - WINDOW.h)).toBe(true);
    expect(Math.max(...ys)).toBe(6000 - WINDOW.h);
    expect(timeline("tour", 800).filter((s) => s.kind === "page").every((s) => s.kind === "page" && s.y === 0)).toBe(true);
  });
});

describe("addresses", () => {
  it("refuses private, loopback and cloud-metadata addresses", () => {
    for (const ip of ["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.20.0.5", "192.168.1.1", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "0.0.0.0"]) expect(isPrivateAddress(ip)).toBe(true);
    for (const ip of ["104.21.3.4", "8.8.8.8", "2606:4700::1"]) expect(isPrivateAddress(ip)).toBe(false);
  });

  it("films only public https pages", () => {
    expect(allowedUrl("https://selam.gojoline.site/")?.hostname).toBe("selam.gojoline.site");
    for (const bad of ["http://example.com", "https://127.0.0.1/", "https://user:pw@example.com", "https://example.com:8443/", "https://localhost/", "file:///etc/passwd", "nonsense"]) expect(allowedUrl(bad)).toBeNull();
  });
});

describe("cards and stops", () => {
  it("escapes the texts and sets the language", () => {
    const assets = { logo: "data:image/svg+xml;base64,AA==", outfit: "data:font/woff2;base64,AA==", ethiopic: "data:font/woff2;base64,AA==" };
    const html = cardHtml("intro", req, assets);
    expect(html).toContain('lang="am"');
    expect(html).toContain("የዕለቱ &lt;አብነት&gt;");
    expect(cardHtml("chrome", req, assets)).toContain("gojoline.afridea.et");
    expect(html).toContain("#FBF9F6");
    expect(html).toContain("font-family:Outfit");
  });

  it("prefers the useful sections (menu, booking, map) after the top", () => {
    const sections = [{ top: 0, text: "Hero" }, { top: 900, text: "Our story" }, { top: 1800, text: "Menu" }, { top: 2600, text: "Reserve a table" }, { top: 3400, text: "Gallery" }];
    expect(pickStops(sections, 2)).toEqual([1800, 3600, 5200]);
  });
});

describe("holiday greetings", () => {
  const assets = { logo: "data:image/svg+xml;base64,AA==", outfit: "data:font/woff2;base64,AA==", ethiopic: "data:font/woff2;base64,AA==" };
  const ok = { lang: "en", motif: "meskel", text: { kicker: "From all of us", title: "Melkam <Meskel>!", sub: "Greetings", footer: "gojoline.com" } };

  it("accepts only a known picture, a language and short texts", () => {
    expect(parseGreeting(ok)).toEqual(ok);
    expect(parseGreeting({ ...ok, motif: "../../etc" })).toBeNull();
    expect(parseGreeting({ ...ok, lang: "fr" })).toBeNull();
    expect(parseGreeting({ ...ok, text: { ...ok.text, title: "x".repeat(161) } })).toBeNull();
    expect(parseGreeting({ ...ok, text: { ...ok.text, sub: 3 } })).toBeNull();
    expect(parseGreeting(null)).toBeNull();
  });

  it("draws every holiday's picture, escapes the words, and loads nothing from the network", () => {
    for (const motif of MOTIFS) {
      const html = greetingHtml({ ...(ok as GreetingRequest), motif }, assets);
      expect(html).toContain("<svg");
      expect(html).toContain("Melkam &lt;Meskel&gt;!");
      expect(html).not.toMatch(/(src|href)="https?:/);
    }
  });
});
