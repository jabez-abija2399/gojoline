import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("start from an industry template in Amharic: a ready site, no AI needed", async ({ page }) => {
  await signIn(page, { lang: "am" });
  // With no sites yet, the templates are what the page shows under the start box.
  await expect(page.getByRole("tab", { name: "አብነቶች" })).toHaveAttribute("aria-selected", "true");
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("button", { name: "ይጠቀሙ: ሆቴል ወይም የእንግዳ ማረፊያ" }).click();
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

test("a template's preview shows every page and section before it is picked", async ({ page }) => {
  await page.goto("/en/templates/hotel");
  await expect(page.getByRole("heading", { level: 1, name: "Tana Shore Lodge" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  // Each section is named: what it is and its own title.
  await expect(page.getByText("Rooms and suites").first()).toBeVisible();
  // Other pages of the template, and the phone layout.
  await page.getByRole("button", { name: "Dining" }).click();
  await expect(page.getByRole("button", { name: "Dining" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Fresh from the lake, cooked at home").first()).toBeVisible();
  await page.getByRole("button", { name: "Phone" }).click();
  await expect(page.getByRole("button", { name: "Phone" })).toHaveAttribute("aria-pressed", "true");
  await expectNoHorizontalScroll(page);

  // Signed in, "Use this template" opens it as a new site straight away.
  await signIn(page);
  await page.goto("/en/templates/hotel");
  await page.getByRole("button", { name: "Use this template" }).last().click();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Your Hotel or guest house site is ready").first()).toBeAttached();
});
