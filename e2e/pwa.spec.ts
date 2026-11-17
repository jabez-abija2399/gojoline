import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("installable: manifest, service worker and offline page are served", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ short_name: "Gojoline", display: "standalone", start_url: "/?source=app" });
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(await sw.text()).toContain("OFFLINE_URL");
  expect(await (await request.get("/offline.html")).text()).toContain("ኢንተርኔት የለም");
  await page.goto("/en");
  // The worker registers after load and takes control.
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL ?? "")).toContain("/sw.js");
});

test("iPhone visitors get the Add to Home Screen steps", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  await page.goto("/am");
  await page.getByRole("button", { name: "መተግበሪያውን ይጫኑ" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Add to Home Screen");
  await dialog.getByRole("button", { name: "ገባኝ" }).click();
  await expect(dialog).toBeHidden();
  await ctx.close();
});

/** Plays the browser's install offer (Chrome fires it only when it decides to). */
async function offerInstall(page: import("@playwright/test").Page) {
  await page.waitForLoadState("load");
  await page.evaluate(() => {
    const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    e.prompt = async () => {
      (window as unknown as { prompted: boolean }).prompted = true;
    };
    e.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(e);
  });
}
const memory = (page: import("@playwright/test").Page) => page.evaluate(() => JSON.parse(localStorage.getItem("gojo.install") ?? "{}"));

test("install pop-up: not on the first visit, then on the second; Not now waits 14 days; Install asks once", async ({ page }) => {
  await signIn(page);
  await offerInstall(page);
  // A phone or a computer, said the way the owner uses it.
  const sheet = page.getByRole("complementary", { name: /Add Gojoline to your (phone|computer)/ });
  // First visit: never.
  await page.waitForTimeout(2500);
  await expect(sheet).toHaveCount(0);

  // A second visit (a new browser session).
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await offerInstall(page);
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText(/Open your sites in one (tap|click)/);
  // Not a blocking modal: the page behind still works.
  await expect(page.getByRole("button", { name: "Start a new site" })).toBeEnabled();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await sheet.getByRole("button", { name: "Not now" }).click();
  await expect(sheet).toBeHidden();
  const snoozed = (await memory(page)).snoozedUntil as number;
  expect(snoozed - Date.now()).toBeGreaterThan(13.9 * 86_400_000);
  await page.reload();
  await offerInstall(page);
  await page.waitForTimeout(2500);
  await expect(sheet).toHaveCount(0);

  // 14 days later it comes back; Install shows the browser's prompt, and it never asks again.
  await page.evaluate(() => localStorage.setItem("gojo.install", JSON.stringify({ ...JSON.parse(localStorage.getItem("gojo.install") ?? "{}"), snoozedUntil: 0 })));
  await page.reload();
  await offerInstall(page);
  await sheet.getByRole("button", { name: "Install" }).click();
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true);
  expect((await memory(page)).never).toBe(true);
  await page.reload();
  await offerInstall(page);
  await page.waitForTimeout(2500);
  await expect(sheet).toHaveCount(0);
});

test("install pop-up after the first site is made: not over the builder on a phone, then on the next page (Amharic, 360 px)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await signIn(page, { lang: "am" });
  await page.getByRole("button", { name: "አዲስ ድረ-ገጽ ይጀምሩ" }).click();
  await expect(page).toHaveURL(/\/am\/build\/[0-9a-f-]{36}$/);
  await offerInstall(page);
  const sheet = page.getByRole("complementary", { name: /ጎጆላይንን ወደ (ስልክዎ|ኮምፒውተርዎ) ያክሉ/ });
  await page.getByRole("textbox", { name: /መልዕክትዎ/ }).fill("Selam Coffee");
  await page.getByRole("textbox", { name: /መልዕክትዎ/ }).press("Enter");
  await expect(page.getByRole("log").getByText(/ነጻ የመጀመሪያ ግንባታ/)).toBeVisible();
  // The chat box and the celebration stay clear on a phone.
  await page.waitForTimeout(2500);
  await expect(sheet).toHaveCount(0);
  expect((await memory(page)).goodMoment).toBe(true);

  await page.goto("/am/build");
  await offerInstall(page);
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "መተግበሪያውን ይጫኑ" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  // Not modal: Escape puts it away even with focus elsewhere on the page.
  await page.locator("body").click({ position: { x: 5, y: 200 } });
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});
