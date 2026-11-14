import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yIssues, signIn } from "./helpers";

test("publish a site, then publish changes to the same address", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Bakery");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Publish your site" });
  const address = dialog.getByLabel("Your site's address");
  await expect(address).toHaveValue("bole-bakery");
  await expectNoSeriousA11yIssues(page);

  await address.fill("telebirr");
  await dialog.getByRole("button", { name: "Publish now" }).click();
  await expect(dialog.getByRole("alert")).toContainText("reserved");

  const slug = `bole-bakery-${Date.now().toString(36)}`;
  await address.fill(slug);
  await dialog.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  await expect(page.getByText(`https://${slug}.sites.example`).first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("Live at")).toBeVisible();

  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Your site's address")).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Publish my latest changes" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
});
