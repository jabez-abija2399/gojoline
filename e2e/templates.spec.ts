import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("start from an industry template in Amharic: a ready site, no AI needed", async ({ page }) => {
  await signIn(page, { lang: "am" });
  await expect(page.getByRole("heading", { name: "ወይም ከአብነት ይጀምሩ" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("button", { name: "ሆቴል ወይም የእንግዳ ማረፊያ" }).click();
  await expect(page).toHaveURL(/\/am\/build\/[0-9a-f-]{36}$/);
  // Version 1 exists, so the site can be published straight away.
  await expect(page.getByRole("button", { name: "ያትሙ", exact: true })).toBeEnabled();
  await page.goto("/am/build");
  await expect(page.getByRole("link", { name: /ጣና ሾር ሆቴል/ })).toBeVisible();
});
