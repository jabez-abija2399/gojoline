import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("dashboard: answers, prices that update the live site, and photos", async ({ page }, info) => {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Buna");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  // The dialog fills in a suggested address first; type over it only after that.
  await expect(page.getByLabel("Your site's address")).toHaveValue(/\w/);
  await page.getByLabel("Your site's address").fill(`bole-buna-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  // Phones keep the dashboard link behind "More".
  if (info.project.name === "mobile") await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Your site's dashboard" })).toBeVisible();
  await expect(page.getByText("No answers yet")).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  await page.getByRole("link", { name: "Prices and lists" }).click();
  const firstPrice = page.getByLabel("Price in Birr (optional)").first();
  await expect(firstPrice).toHaveValue("40");
  // Typing a decimal keeps what was typed (it used to jump to 405).
  await firstPrice.fill("45.5");
  await expect(firstPrice).toHaveValue("45.5");
  await page.getByRole("button", { name: "Save" }).first().click();
  await expect(page.getByText("Saved and updated on your live site.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Price in Birr (optional)").first()).toHaveValue("45.5");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await page.getByRole("link", { name: "Photos" }).click();
  await expect(page.getByText("No photos yet.")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/fake.jpg");
  await expect(page.getByText("That file isn't a photo we can use")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByText("Photo added.")).toBeVisible();
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible();
  await page.getByRole("button", { name: "Remove photo 1" }).click();
  await expect(page.getByText("Photo removed.")).toBeVisible();
  await expect(page.getByText("No photos yet.")).toBeVisible();
});

test("another owner can't see a dashboard", async ({ page, browser }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  await page.waitForURL(/\/build\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  const other = await browser.newPage();
  await signIn(other);
  const res = await other.goto(`/en/dashboard/${id}`);
  expect(res?.status()).toBe(404);
  expect((await other.request.get(`/api/projects/${id}/submissions`)).status()).toBe(404);
  expect((await other.request.get(`/api/projects/${id}/lists`)).status()).toBe(404);
  await other.close();
});
