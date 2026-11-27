import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("site cards show each site's own photo and headline, privately", async ({ page, browser }) => {
  await signIn(page);
  for (const id of ["cafe", "hotel"]) {
    await page.goto("/en/build#templates");
    await page.locator(`form[data-preset=${id}] button`).click();
    await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}(\?setup=1)?$/);
  }
  await page.goto("/en/build#sites");
  const pictures = page.locator("img[src*='/card?k=']");
  await expect(pictures).toHaveCount(2);
  // The pictures load (our route, the owner's session).
  for (const img of await pictures.all()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  const src = (await pictures.first().getAttribute("src"))!;
  expect((await page.request.get(src)).headers()["content-type"]).toBe("image/webp");
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  // Someone else can't load an owner's (possibly unpublished) picture.
  const { viewport, userAgent, isMobile, hasTouch, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, baseURL });
  const other = await ctx.newPage();
  await signIn(other, { contact: `cards-other-${Date.now()}-${test.info().project.name}@example.com` });
  expect((await other.request.get(src)).status()).toBe(404);
  await ctx.close();
});
