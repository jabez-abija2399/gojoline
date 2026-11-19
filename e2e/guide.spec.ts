import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, openAppMenu, signIn } from "./helpers";

/** The guide is checked at 360 px (phones) and 1366 px (a common laptop). */
async function sizeFor(page: Page, project: string) {
  await page.setViewportSize(project === "mobile" ? { width: 360, height: 780 } : { width: 1366, height: 860 });
}

const TEXT = {
  en: { h1: "How to use Gojoline", toc: "On this page", describe: "Describe your business", play: "0:17: play part 2, Describe your business", faq: "Questions" },
  am: { h1: "ጎጆላይንን እንዴት መጠቀም እንደሚቻል", toc: "በዚህ ገጽ ላይ", describe: "ንግድዎን ይግለጹ", play: "0:17 ፦ ክፍል 2፣ ንግድዎን ይግለጹ፣ ከዚህ ጀምሮ አጫውት", faq: "ጥያቄዎች" },
} as const;

for (const lang of ["en", "am"] as const) {
  test(`guide (${lang}): video loads nothing until played, ten sections, contents jump the video, accessible`, async ({ page }, info) => {
    await sizeFor(page, info.project.name);
    const t = TEXT[lang];
    const media: string[] = [];
    page.on("request", (r) => r.url().endsWith(".mp4") && media.push(r.url()));
    await page.goto(`/${lang}/guide`);
    await expect(page.getByRole("heading", { level: 1, name: t.h1 })).toBeVisible();

    const video = page.locator("video#guide-video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute("poster", "/guide/gojoline-guide-poster.webp");
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveAttribute("playsinline", "");
    await expect(video.locator('track[kind="captions"][srclang="en"]')).toHaveAttribute("src", "/guide/captions-en.vtt");
    await expect(video.locator('track[kind="captions"][srclang="am"]')).toHaveAttribute("src", "/guide/captions-am.vtt");
    await expect(video.locator('track[kind="chapters"]')).toHaveAttribute("src", `/guide/chapters-${lang}.vtt`);
    // A silent video with English on screen: the Amharic page shows the Amharic captions without pressing CC.
    const amDefault = video.locator('track[kind="captions"][srclang="am"]');
    if (lang === "am") await expect(amDefault).toHaveAttribute("default", "");
    else await expect(amDefault).not.toHaveAttribute("default", /.*/);
    await expect(video.locator('track[kind="captions"][srclang="en"]')).not.toHaveAttribute("default", /.*/);
    // The captions file is real WebVTT.
    const vtt = await page.request.get("/guide/captions-am.vtt");
    expect(vtt.headers()["content-type"]).toContain("text/vtt");
    expect(await vtt.text()).toMatch(/^WEBVTT\n\n1\n00:00:04\.800 --> /);

    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(12); // ten sections, the questions and the call to action
    await expect(page.getByRole("heading", { level: 2, name: t.describe })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: t.faq })).toBeVisible();
    // Real prices from the billing settings (defaults in e2e).
    await expect(page.getByText(lang === "en" ? "499 Birr a month" : "በወር 499 ብር", { exact: true })).toBeVisible();

    // Contents: a sticky column on large screens, folded away on phones.
    const toc = page.getByRole("navigation", { name: t.toc });
    if (info.project.name === "mobile") {
      await expect(toc).toBeHidden();
      await page.locator("details summary", { hasText: t.toc }).click();
    }
    await expect(toc).toBeVisible();
    await toc.getByRole("link", { name: t.describe, exact: true }).click();
    await expect(page).toHaveURL(/#guide-describe$/);
    // Nothing of the video has loaded yet; a chapter click starts it there.
    expect(media).toEqual([]);
    await toc.getByRole("link", { name: t.play }).click();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBe(17);
    await expect.poll(() => media.length).toBeGreaterThan(0);
    await expect(video).toBeFocused();
    await expect(video).toBeInViewport();

    await page.goto(`/${lang}/guide`);
    await expectNoSeriousA11yIssues(page);
    await expectNoHorizontalScroll(page);
  });
}

test("guide: screenshots are responsive pictures, all lazy (none is above the fold)", async ({ page }, info) => {
  await sizeFor(page, info.project.name);
  await page.goto("/en/guide");
  const imgs = page.locator("main picture img");
  expect(await imgs.count()).toBeGreaterThanOrEqual(15);
  for (const loading of await imgs.evaluateAll((els) => els.map((i) => i.getAttribute("loading")))) expect(loading).toBe("lazy");
  // The poster (the LCP element) is preloaded at high priority instead.
  await expect(page.locator('link[rel="preload"][as="image"][href="/guide/gojoline-guide-poster.webp"]')).toHaveAttribute("fetchpriority", "high");
  await expect(imgs.first()).toHaveAttribute("width", "1440");
  await expect(page.locator("main picture source[type='image/avif']").first()).toHaveAttribute("srcset", /\.avif 390w/);
  // The browser picks the phone picture on phones, the computer one on wide screens.
  await imgs.first().scrollIntoViewIfNeeded();
  await expect.poll(() => imgs.first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  const src = await imgs.first().evaluate((i: HTMLImageElement) => i.currentSrc);
  expect(src).toMatch(info.project.name === "mobile" ? /phone-01-start-390\.(avif|webp)$/ : /01-start-(720|1440)\.(avif|webp)$/);
});

test("guide is linked from public pages and the sitemap", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "How to use Gojoline" })).toHaveAttribute("href", "/en/guide");
  await page.goto("/am/pricing");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "ጎጆላይንን እንዴት መጠቀም እንደሚቻል" })).toHaveAttribute("href", "/am/guide");
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/en/guide</loc>");
  expect(sitemap).toContain("/am/guide</loc>");
  // Signed out, the guide uses the public header and footer.
  await page.goto("/en/guide");
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("guide is linked from the start screen, the menu and a site's dashboard", async ({ page }, info) => {
  await signIn(page);
  // First visit, no sites yet: the start screen offers the guide.
  const startLink = page.getByRole("link", { name: "New here? Watch the 5-minute guide" });
  await expect(startLink).toHaveAttribute("href", "/en/guide");
  await startLink.click();
  await expect(page.getByRole("heading", { level: 1, name: "How to use Gojoline" })).toBeVisible();
  // Signed in, it opens inside the app with the menu, and the menu marks it.
  await openAppMenu(page);
  const guide = page.locator("#app-sidebar").getByRole("link", { name: "Guide", exact: true });
  await expect(guide).toHaveAttribute("aria-current", "page");
  if (info.project.name === "mobile") await page.keyboard.press("Escape");
  // A signed-in "Build your website" goes straight to the start screen.
  await expect(page.getByRole("link", { name: "Build your website" })).toHaveAttribute("href", "/en/build");

  // A site's dashboard Home links to it too.
  await page.goto("/en/build");
  await page.getByRole("button", { name: "Start a new site" }).click();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Buna");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  const projectId = page.url().split("/").pop()!;
  await page.goto(`/en/dashboard/${projectId}`);
  await expect(page.getByRole("link", { name: "New to Gojoline? Read the guide" })).toHaveAttribute("href", "/en/guide");
});
