import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("dashboard: Home first, no Content section, old Content links open Home", async ({ page }, info) => {
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
  // Home comes first; with no messages yet it says so.
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region", { name: "Latest messages" }).getByText("No messages yet")).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  // No Content section: content changes go through the AI (and use changes). Old links open Home.
  const tabs = page.getByRole("navigation", { name: "Your site's dashboard" });
  await expect(tabs.getByRole("link")).toHaveText(["Home", "Messages", "Business info", "Settings"].map((n) => new RegExp(n)));
  const dashboard = page.url().split("?")[0];
  for (const old of ["content", "lists", "photos"]) {
    await page.goto(`${dashboard}?tab=${old}`);
    await expect(tabs.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Price in Birr (optional)")).toHaveCount(0);
  }
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
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeVisible();
  const kpi = (label: string) => page.getByRole("listitem").filter({ hasText: new RegExp(`^${label}`) });
  await expect(kpi("Waiting for an answer")).toContainText("3");
  await expect(kpi("Messages")).toContainText("your first week");
  // No visitors yet: the empty state says what to do, with the QR code one tap away.
  await expect(page.getByText("No visitors yet: share your link or QR code.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show QR code" })).toBeVisible();
  const latest = page.getByRole("region", { name: "Latest messages" });
  await expect(latest.getByText("Abebe Kebede · 0911000000")).toBeVisible();
  await expect(latest.getByRole("link").first()).toHaveAttribute("href", /tab=messages/);
  await expect(latest.getByText("Booking").first()).toBeVisible();
  // The Messages tab says how many are new.
  await expect(page.getByRole("navigation").getByRole("link", { name: /Messages 3 waiting for an answer/i })).toBeVisible();
  // Built and published are ticked; the details, photos, Telegram and an own address are next.
  const next = page.getByRole("region", { name: "Next step" });
  await next.getByText("All steps (2 of 6 done)").click();
  // Photos are added by asking the AI (it uses changes), so the step opens the builder.
  await expect(next.getByRole("link", { name: /Ask the AI to add your photos/ })).toHaveAttribute("href", new RegExp(`/en/build/${projectId}$`));
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
