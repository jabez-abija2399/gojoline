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
  await expect(page.getByText("Your site's dashboard")).toBeVisible();
  // The overview comes first; with no answers yet it says so.
  await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region", { name: "Latest answers" }).getByText("No answers yet")).toBeVisible();
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

test("overview: live status, real numbers, latest answers and what to do next", async ({ page, browser }, info) => {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Buna");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  const projectId = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Your site's address")).toHaveValue(/\w/);
  await page.getByLabel("Your site's address").fill(`overview-${info.project.name}-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();

  const seeded = await page.request.post("/api/test/answers", { data: { projectId, count: 3 } });
  expect(seeded.status()).toBe(200);
  await page.goto(`/en/dashboard/${projectId}`);

  await expect(page.getByRole("heading", { name: "Your site is live" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Share on Telegram" })).toHaveAttribute("href", /^https:\/\/t\.me\/share\/url\?url=https/);
  const kpi = (label: string) => page.getByRole("listitem").filter({ hasText: label });
  await expect(kpi("New answers")).toContainText("3");
  await expect(kpi("Last 7 days")).toContainText("Your first answers!");
  await expect(kpi("All answers")).toContainText("3");
  await expect(page.getByRole("figure").filter({ hasText: "Answers in the last 14 days" })).toBeVisible();
  const latest = page.getByRole("region", { name: "Latest answers" });
  await expect(latest.getByText("Abebe Kebede · 0911000000 · 1")).toBeVisible();
  await expect(latest.getByRole("link").first()).toHaveAttribute("href", /tab=answers/);
  await expect(latest.getByText("Booking").first()).toBeVisible();
  // The Answers tab says how many are new.
  await expect(page.getByRole("navigation").getByRole("link", { name: /Answers 3 New/ })).toBeVisible();
  // Built and published are ticked; photos, Telegram and an own address are next.
  const setup = page.getByRole("region", { name: "Make the most of your site" });
  await expect(setup.getByText("2 of 5 done")).toBeVisible();
  await expect(setup.getByRole("link", { name: /Add your photos/ })).toHaveAttribute("href", /tab=photos/);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  // Someone else signed in can neither see this dashboard nor add answers to it.
  const otherContext = await browser.newContext();
  const stranger = await otherContext.newPage();
  await signIn(stranger);
  expect((await stranger.goto(`/en/dashboard/${projectId}`))?.status()).toBe(404);
  expect((await stranger.request.post("/api/test/answers", { data: { projectId, count: 1 } })).status()).toBe(404);
  await otherContext.close();
});
