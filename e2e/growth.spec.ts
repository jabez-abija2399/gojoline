import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

// Growth loops (2026-11-18). Runs against the deterministic demo AI and in-memory host (E2E=1).

/** Builds and publishes a site; returns its project id. */
async function publishNewSite(page: Page, name: string) {
  await page.getByRole("button", { name: "Start a new site" }).click();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
  const projectId = page.url().split("/").pop()!;
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill(name);
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Publish your site" });
  await dialog.getByLabel("Your site's address").fill(`${name.toLowerCase().replace(/\W+/g, "-")}-${Date.now().toString(36)}`);
  await dialog.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  return projectId;
}

test("the Made with Gojoline badge links home on a Free site and is gone on a paid plan", async ({ page }) => {
  await signIn(page);
  const projectId = await publishNewSite(page, "Badge Bakery");
  const free = await (await page.request.get(`/api/test/published?projectId=${projectId}`)).text();
  const href = /<a href="([^"]+)" data-gojoline-badge/.exec(free)?.[1];
  expect(href).toBeTruthy();
  const url = new URL(href!);
  expect(url.hostname).not.toBe("gojoline.com");
  expect(url.pathname).toBe("/en");
  expect(url.searchParams.get("ref")).toMatch(/^site_badge-bakery-/);
  expect(url.searchParams.get("utm_source")).toBe("gojoline_badge");

  // On Starter the same site publishes without it.
  await page.request.post("/api/test/credits", { data: { left: 10, plan: "starter" } });
  await page.reload();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish my latest changes" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  const paid = await (await page.request.get(`/api/test/published?projectId=${projectId}`)).text();
  expect(paid).not.toContain("data-gojoline-badge");
});
