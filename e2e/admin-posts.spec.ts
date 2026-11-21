import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

// One shared memory store serves both projects: the full flow runs on desktop only.
test("admin plans a week of posts, edits one, posts it to Telegram, and has a posting kit", async ({ page }, info) => {
  await signIn(page, { contact: `admin-e2e-posts-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts");
  await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible();
  await expect(page.getByText("Telegram: connected (@gojoline_e2e)")).toBeVisible();
  await expect(page.getByText(/Facebook: not connected yet/)).toBeVisible();
  if (info.project.name === "mobile") {
    // Phones, in Amharic, with the cards (planned by the desktop run or here) and their sections open.
    await page.goto("/am/admin?tab=posts");
    await page.getByRole("button", { name: "የሚቀጥሉትን 7 ቀናት ያቅዱ" }).click();
    const first = page.locator("li[id^=post-]").first();
    await expect(first).toBeVisible();
    for (const s of await first.locator("summary").all()) await s.click();
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
  await card.locator("summary").filter({ hasText: "Edit" }).click();
  await card.getByLabel("Caption in English").fill("Your website, from one message. Start free.");
  await card.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /^Saved\.$/ })).toBeVisible();
  const id = await card.getAttribute("id");
  const same = page.locator(`li#${id}`);
  await expect(same).toContainText("Your website, from one message. Start free.");
  // English only: there is no Amharic caption to review.
  await expect(same.getByLabel("Caption in Amharic")).toHaveCount(0);

  // The posting kit has each network's text with its tracked link.
  await same.locator("summary").filter({ hasText: "Posting kit" }).click();
  await expect(same.getByLabel("Text for TikTok")).toHaveValue(/utm_source=tiktok/);
  await expect(same.getByRole("link", { name: "Download the picture or video" })).toHaveAttribute("href", /\/api\/admin\/posts\/.+\/media\?download=1/);

  // A video of the template (the e2e stand-in renderer), kept as the post's media.
  await same.getByRole("button", { name: /^Make video/ }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /^Done\.$/ })).toBeVisible();
  await expect(page.locator(`li#${id} video`)).toBeVisible();
  await expect(page.locator(`li#${id}`).getByRole("button", { name: /^Make the video again/ })).toBeVisible();

  // Post now: approved and sent to the channel.
  // Posting to the public channel asks first.
  page.once("dialog", (d) => d.accept());
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
