import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, openAppMenu, signIn, unfold } from "./helpers";

/** A second browser on the same device as the test's own page. */
async function newPage(browser: Browser) {
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  return { page: await ctx.newPage(), close: () => ctx.close() };
}

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
  expect(url.searchParams.get("ref")).toMatch(/^site_badge-bakery/);
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

test("a business joins through an invite link; when the admin approves its first payment both are thanked", async ({ page, browser }) => {
  // The inviter finds the link from the sidebar.
  await signIn(page);
  await openAppMenu(page);
  await page.getByRole("link", { name: "Invite a business" }).click();
  await expect(page.getByRole("heading", { name: "Invite a business" })).toBeVisible();
  const link = await page.getByLabel("Your invite link").inputValue();
  expect(link).toMatch(/\/en\?ref=u_[a-z2-9]{8}$/);
  await expect(page.getByText("No one has joined with your link yet.")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  // The new owner opens the link, signs up and pays for Starter.
  const invited = await newPage(browser);
  await invited.page.goto(new URL(link).pathname + new URL(link).search);
  // Another business: a different email domain (the same company's domain counts as inviting yourself).
  await signIn(invited.page, { contact: `invited-${Date.now()}-${test.info().project.name}@example.org` });
  await invited.page.goto("/en/billing");
  await invited.page.getByLabel("What are you paying for?").selectOption("starter_month");
  const reference = `REF${Date.now().toString(36).toUpperCase()}${test.info().project.name.length}`;
  await invited.page.getByLabel("Transaction number").fill(reference);
  await invited.page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await invited.page.getByRole("button", { name: "Send for checking" }).click();
  await expect(invited.page.getByRole("status").filter({ hasText: "Thank you" })).toBeVisible();

  // The admin approves it, then sees the invite and where the sign-up came from.
  const admin = await newPage(browser);
  await signIn(admin.page, { contact: `admin-e2e-grow-${test.info().project.name}@example.com` });
  await admin.page.goto("/en/admin?tab=payments");
  const item = admin.page.getByRole("listitem").filter({ hasText: reference });
  await item.getByRole("button", { name: "Approve" }).click();
  await expect(admin.page.getByRole("listitem").filter({ hasText: reference })).toHaveCount(0);
  await admin.page.goto("/en/admin?tab=growth");
  await expect(admin.page.getByRole("heading", { name: "Invites" })).toBeVisible();
  await expect(admin.page.getByText("Thanked").first()).toBeVisible();
  await expectNoSeriousA11yIssues(admin.page);
  await admin.page.goto("/en/admin");
  const sources = admin.page.getByRole("region", { name: "Where sign-ups came from" });
  const row = sources.getByRole("row", { name: /Invite from an owner/ });
  await expect(row.getByRole("cell").first()).not.toHaveText("0");
  await admin.close();

  // Both see the thank-you in their history of changes.
  for (const p of [page, invited.page]) {
    await p.goto("/en/billing");
    await unfold(p, /History of your changes/);
    await expect(p.getByText("Thank-you for an invite")).toBeVisible();
  }
  await expect(page.getByText(/1 invited · 1 thanked so far/)).toBeVisible();
  await invited.close();
});

test("an owner opts in to the showcase, the site appears on /showcase, and an admin can hide it", async ({ page, browser }) => {
  await signIn(page);
  const name = `Showcase Cafe ${Date.now().toString(36)}`;
  const projectId = await publishNewSite(page, name);
  await page.goto(`/en/showcase`);
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);

  await page.goto(`/en/dashboard/${projectId}?tab=settings`);
  const optIn = page.getByRole("checkbox", { name: "Show my site in the Gojoline showcase" });
  await expect(optIn).not.toBeChecked();
  await optIn.check();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  await page.goto("/en/showcase");
  await expect(page.getByRole("heading", { level: 1, name: "Sites made with Gojoline" })).toBeVisible();
  const card = page.getByRole("link", { name: new RegExp(name) });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("href", /^https:\/\/.+\.sites\.example$/);
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  const admin = await newPage(browser);
  await signIn(admin.page, { contact: `admin-e2e-show-${test.info().project.name}@example.com` });
  await admin.page.goto("/en/admin?tab=growth");
  await admin.page.getByRole("button", { name: `Hide: ${name}` }).click();
  await expect(admin.page.getByRole("button", { name: `Show again: ${name}` })).toBeVisible();
  await admin.close();
  await page.reload();
  await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
});
