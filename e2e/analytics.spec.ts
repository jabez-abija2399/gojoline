import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("admin analytics: a visitor's click on Pricing shows up, by day, week and month", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  // A visitor clicks the Pricing link on the home page (counted with a beacon).
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  const visitor = await ctx.newPage();
  await visitor.goto("/en");
  // The click listener is part of the page's code: under a busy suite it may not be running yet, so click until it counts.
  await expect(async () => {
    await visitor.goto("/en");
    await visitor.waitForLoadState("networkidle");
    const counted = visitor.waitForResponse((r) => r.url().endsWith("/api/track") && r.request().method() === "POST", { timeout: 4000 });
    await visitor.locator('a[href="/en/pricing"]').first().evaluate((a: HTMLAnchorElement) => a.click());
    expect((await counted).status()).toBe(204);
  }).toPass({ timeout: 25_000 });
  await ctx.close();

  await signIn(page, { contact: `admin-e2e-an-${test.info().project.name}@example.com` });
  await page.goto("/en/admin?tab=analytics");
  await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  const clicks = page.getByRole("region", { name: /Link clicks/ });
  await expect(clicks.getByRole("rowheader", { name: "Pricing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "From sign-up to paying" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await page.getByRole("link", { name: "Weekly" }).click();
  await expect(page.getByRole("heading", { name: "This week" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Weekly" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Monthly" }).click();
  await expect(page.getByRole("heading", { name: "This month" })).toBeVisible();
  await expect(clicks.getByRole("rowheader", { name: "Pricing" })).toBeVisible();

  // Amharic too.
  await page.goto("/am/admin?tab=analytics&period=week");
  await expect(page.getByRole("heading", { level: 1, name: "ትንታኔ" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("the click counter accepts only known names and never errors", async ({ request }) => {
  for (const data of ['{"n":"pricing","p":"landing"}', '{"n":"evil","p":"landing"}', "not json", '{"n":"pricing","p":"landing","x":1}']) {
    const r = await request.post("/api/track", { data, headers: { "Content-Type": "application/json", Origin: String(test.info().project.use.baseURL) } });
    expect(r.status()).toBe(204);
  }
});
