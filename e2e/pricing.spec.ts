import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues } from "./helpers";

test("pricing: monthly and yearly prices, the full comparison, notes and extras", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("heading", { level: 1, name: "Simple prices in Birr" })).toBeVisible();
  const billing = page.getByRole("navigation", { name: "How often you pay" });
  await expect(billing.getByRole("link", { name: "Monthly" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("499 Birr", { exact: true })).toBeVisible();
  await expect(page.getByText("or 4,990 Birr a year (2 months free)")).toBeVisible();
  await expect(page.getByText("Recommended")).toBeVisible();

  const table = page.getByRole("table", { name: "What each plan includes" });
  await expect(table.getByRole("columnheader", { name: "Business" })).toBeVisible();
  await expect(table.getByRole("row", { name: /Photo storage/ })).toContainText("50 MB");
  await expect(table.getByRole("row", { name: /Edit your site from Telegram/ }).getByText("Not included")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Good to know" })).toBeVisible();
  await expect(page.getByText("30 more AI changes for 249 Birr", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ask us on Telegram" })).toHaveAttribute("href", /t\.me/);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await billing.getByRole("link", { name: /Yearly/ }).click();
  await expect(page).toHaveURL(/billing=yearly/);
  await expect(billing.getByRole("link", { name: /Yearly/ })).toHaveAttribute("aria-current", "true");
  await expect(page.getByText("4,990 Birr", { exact: true })).toBeVisible();
  await expect(page.getByText("You save 998 Birr a year: 2 months free")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("pricing works in Amharic and without JavaScript", async ({ browser }) => {
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/am/pricing?billing=yearly");
  await expect(page.getByRole("heading", { level: 1, name: "ቀላል ዋጋዎች በብር" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "የክፍያ ጊዜ" }).getByRole("link", { name: /በዓመት/ })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("table", { name: "እያንዳንዱ ዕቅድ የሚያካትተው" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await ctx.close();
});
