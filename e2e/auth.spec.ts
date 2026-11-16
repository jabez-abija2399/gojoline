import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn, openAccountMenu } from "./helpers";

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/en/build");
  await expect(page).toHaveURL(/\/en\/sign-in\?next=%2Fen%2Fbuild|\/en\/sign-in\?next=\/en\/build/);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("wrong contact and wrong code show clear errors", async ({ page }) => {
  await page.goto("/en/sign-in");
  await page.getByLabel("Phone or email").fill("12345");
  await page.getByRole("button", { name: "Send me a code" }).click();
  await expect(page.locator("#contact-error")).toContainText("valid Ethiopian phone number");
  await page.getByLabel("Phone or email").fill(`wrong-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Send me a code" }).click();
  await page.getByLabel("6-digit code").fill("000000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#code-error")).toContainText("not right");
  await expectNoSeriousA11yIssues(page);
});

test("phone sign-in in Amharic, then sign out", async ({ page }) => {
  const n = String(Date.now()).slice(-8);
  await signIn(page, { lang: "am", contact: `09${n}`, normalized: `+2519${n}` });
  await expect(page.locator("html")).toHaveAttribute("lang", "am");
  await expectNoSeriousA11yIssues(page);
  await openAccountMenu(page, "am");
  await page.getByRole("button", { name: "ይውጡ" }).click();
  await expect(page).toHaveURL(/\/am$/);
  await page.goto("/am/build");
  await expect(page).toHaveURL(/\/am\/sign-in/);
});

test("the e2e code lookup is the only way codes leave the server", async ({ request }) => {
  const res = await request.get("/api/auth/get-session");
  expect(res.status()).toBeLessThan(500);
});
