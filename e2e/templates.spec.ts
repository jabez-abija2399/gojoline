import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("start from an industry template in Amharic: a ready site, no AI needed", async ({ page }) => {
  await signIn(page, { lang: "am" });
  // With no sites yet, the templates are what the page shows under the start box.
  await expect(page.getByRole("tab", { name: "አብነቶች" })).toHaveAttribute("aria-selected", "true");
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("button", { name: "ሆቴል ወይም የእንግዳ ማረፊያ" }).click();
  await expect(page).toHaveURL(/\/am\/build\/[0-9a-f-]{36}$/);
  // The chat says it's a ready example to personalise; publishing waits for real details.
  await expect(page.getByText("ድረ-ገጽዎ ዝግጁ ነው").first()).toBeAttached();
  await page.getByRole("button", { name: "ያትሙ", exact: true }).click();
  const address = page.getByLabel("የድረ-ገጽዎ አድራሻ");
  await expect(address).toHaveValue(/\w/);
  await address.fill(`tana-${test.info().project.name}-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "አሁን ያትሙ" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("የምሳሌ መረጃዎች");
  await page.keyboard.press("Escape");
  await page.goto("/am/build");
  // Named after the kind of business, not the example's made-up name.
  await expect(page.getByRole("main").getByRole("link", { name: "ሆቴል ወይም የእንግዳ ማረፊያ", exact: true })).toBeVisible();
});
