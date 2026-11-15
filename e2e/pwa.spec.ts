import { expect, test } from "@playwright/test";

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
