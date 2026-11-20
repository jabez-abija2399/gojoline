import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yIssues, signIn } from "./helpers";

test("download your website: Business only, the live site as a ZIP; staff see the site's files in Admin", async ({ page, browser }) => {
  const project = test.info().project;
  // An owner publishes a site.
  const owner = await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Bakery");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  const id = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Publish your site" });
  const slug = `dl-${project.name}-${Date.now().toString(36)}`;
  await dialog.getByLabel("Your site's address").fill(slug);
  await dialog.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();

  // Free plan: what it is and where to get it, no button; the API agrees.
  await page.goto(`/en/dashboard/${id}?tab=settings`);
  const card = page.getByRole("region", { name: "Download your website" });
  await expect(card.getByText("Downloading your website is part of the Business plan.")).toBeVisible();
  await expect(card.getByRole("button", { name: "Download ZIP" })).toHaveCount(0);
  expect(await page.evaluate(async (u) => (await fetch(u, { method: "POST" })).status, `/api/projects/${id}/download`)).toBe(403);
  // Only POST from Gojoline itself starts a build (a link on another site can't).
  expect((await page.request.get(`/api/projects/${id}/download`)).status()).toBe(405);

  // An admin moves the owner to Business.
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  const admin = await ctx.newPage();
  await signIn(admin, { contact: `admin-e2e-own-${project.name}@example.com` });
  await admin.goto(`/en/admin?tab=users&q=${encodeURIComponent(owner)}`);
  await admin.getByRole("table").getByRole("link", { name: /Details$/ }).first().click();
  const plan = admin.locator("form").filter({ has: admin.getByRole("heading", { name: "Set plan" }) });
  await plan.getByLabel("New plan").selectOption("business_month");
  await plan.getByLabel("Reason (saved in the log)").fill("Download test");
  await plan.getByRole("button", { name: "Set plan" }).click();
  await expect(plan.getByRole("status")).toHaveText("Plan updated.");

  // Staff can read the site's files (owners can't: there is no code view for them).
  await admin.goto("/en/admin?tab=sites");
  const row = admin.getByRole("listitem").filter({ hasText: slug });
  await row.getByText("Site files").click();
  await expect(row.locator("pre")).toContainText('"en": "Bole Bakery"');
  await ctx.close();

  // Business: the button downloads the live site as a ZIP.
  await page.reload();
  await expectNoSeriousA11yIssues(page);
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Download ZIP" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe(`${slug}-website.zip`);
  const bytes = await (await file.createReadStream()).toArray();
  const zip = Buffer.concat(bytes as Buffer[]);
  expect(zip.subarray(0, 4).toString("hex")).toBe("504b0304");
  expect(zip.includes(Buffer.from("README.txt"))).toBe(true);
  expect(zip.includes(Buffer.from("index.html"))).toBe(true);
  await expect(card.getByRole("status")).toContainText("Downloaded.");
});
