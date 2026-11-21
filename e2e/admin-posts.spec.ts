import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

// One shared memory store serves both projects: the full flow runs on desktop only.
test("admin plans a week of posts, edits one, posts it to Telegram, and has a posting kit", async ({ page }, info) => {
  await signIn(page, { contact: `admin-e2e-posts-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts");
  await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible();
  await expect(page.getByText("Telegram channel: @gojoline_e2e")).toBeVisible();
  if (info.project.name === "mobile") {
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
    return;
  }
  await page.getByRole("button", { name: "Plan the next 7 days" }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /new posts planned|already has a post/ })).toBeVisible();
  const card = page.locator("li[id^=post-]").filter({ has: page.locator("img") }).first();
  await expect(card).toBeVisible();
  // A template post shows the template's picture.
  await expect(page.locator("li[id^=post-] img").first()).toBeVisible();

  // Edit the Amharic caption and save.
  await card.getByText("Edit", { exact: true }).click();
  await card.getByLabel("Caption in Amharic").fill("ድረ-ገጽዎን በመጻፍ ይሥሩ።");
  await card.getByRole("button", { name: "Save" }).click();
  const id = await card.getAttribute("id");
  const same = page.locator(`li#${id}`);
  await expect(same).toContainText("ድረ-ገጽዎን በመጻፍ ይሥሩ።");

  // The posting kit has each network's text with its tracked link.
  await same.getByText("Posting kit").click();
  await expect(same.getByLabel("Text for TikTok")).toHaveValue(/utm_source=tiktok/);
  await expect(same.getByRole("link", { name: "Download the picture or video" })).toHaveAttribute("href", /\/api\/admin\/posts\/.+\/media\?download=1/);

  // Post now: approved and sent to the channel.
  await same.getByRole("button", { name: /^Post now/ }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /^Done\.$/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Sent" }).or(page.locator("section[aria-labelledby=posts-sent]"))).toContainText("Sent to Telegram");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("only admins can see post media", async ({ page }) => {
  await signIn(page);
  expect((await page.request.get("/api/admin/posts/00000000-0000-4000-8000-000000000000/media")).status()).toBe(404);
  expect((await page.goto("/en/admin?tab=posts"))?.status()).toBe(404);
});
