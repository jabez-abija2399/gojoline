import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("an owner sends a payment and an admin approves it", async ({ page, browser }) => {
  await signIn(page);
  await page.getByRole("link", { name: "Plan" }).click();
  await expect(page.getByRole("heading", { name: "Plan and payments", level: 1 })).toBeVisible();
  await expect(page.getByText("Your plan: Free")).toBeVisible();
  await expect(page.locator('li[aria-current="true"]')).toContainText("Your plan");
  await expect(page.getByText("Telebirr: 0911000000")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  await page.getByLabel("What are you paying for?").selectOption("starter_month");
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("transaction number");
  await expect(page.getByLabel("Transaction number")).toBeFocused();

  const reference = `E2E${Date.now().toString(36).toUpperCase()}${test.info().project.name.length}`;
  await page.getByLabel("Transaction number").fill(reference);
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("add a photo");
  await page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByText("photo.jpg selected")).toBeVisible();
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Thank you" })).toBeFocused();

  // The same transaction number cannot be used twice, even typed differently.
  await page.getByLabel("Transaction number").fill(reference.toLowerCase().replace("E2E", "e2e-"));
  await page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("already sent");

  // Ordinary owners can't see the admin page.
  expect((await page.goto("/en/admin"))?.status()).toBe(404);

  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  const admin = await ctx.newPage();
  await signIn(admin, { contact: `admin-e2e-${test.info().project.name}@example.com` });
  await admin.goto("/en/admin");
  const item = admin.getByRole("listitem").filter({ hasText: reference });
  await expect(item).toBeVisible();
  await expectNoSeriousA11yIssues(admin);
  await item.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByRole("listitem").filter({ hasText: reference })).toHaveCount(0);
  await ctx.close();

  await page.goto("/en/billing");
  await expect(page.getByText("Your plan: Starter")).toBeVisible();
  await expect(page.getByText("Approved")).toBeVisible();
});
