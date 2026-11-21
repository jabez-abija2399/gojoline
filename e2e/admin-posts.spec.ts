import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

// One shared memory store serves both projects: the full flow runs on desktop only.
test("admin plans a week of posts, edits one, posts it to Telegram, and has a posting kit", async ({ page }, info) => {
  await signIn(page, { contact: `admin-e2e-posts-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts");
  await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible();
  // One view at a time: To review, Scheduled, Sent, Connections.
  await expect(page.getByRole("navigation", { name: "Posts" }).getByRole("link")).toHaveCount(4);
  await page.getByRole("navigation", { name: "Posts" }).getByRole("link", { name: /^Connections/ }).click();
  await expect(page).toHaveURL(/view=connections/);
  const tgCard = page.locator("#connect-telegram");
  await expect(tgCard).toContainText("Connected");
  await expect(tgCard).toContainText("@gojoline_e2e");
  if (info.project.name === "mobile") {
    // Phones, in Amharic, with the cards (planned by the desktop run or here) and their sections open.
    await page.goto("/am/admin?tab=posts");
    await page.getByRole("button", { name: "የሚቀጥሉትን 7 ቀናት ያቅዱ" }).click();
    await expect(page.getByRole("list", { name: "የሚቀጥሉት 7 ቀናት" }).getByRole("listitem")).toHaveCount(7);
    await page.goto("/am/admin?tab=posts&view=review");
    const first = page.locator("li[id^=post-]").first();
    await expect(first).toBeVisible();
    for (const s of await first.locator("summary").all()) await s.click();
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
    return;
  }
  // Connect Facebook from Admin: a wrong token is refused with Meta's reason, the right one connects.
  const fb = page.locator("#connect-facebook");
  await expect(fb).toContainText("Not connected");
  await fb.locator("summary").click();
  await fb.getByLabel("Page ID").fill("123456789012345");
  await fb.getByLabel("Page access token").fill("wrong-token-0123456789abcdef");
  await fb.getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-facebook").getByRole("alert")).toContainText("Meta didn't accept the token");
  await page.locator("#connect-facebook summary").click();
  await page.locator("#connect-facebook").getByLabel("Page ID").fill("123456789012345");
  await page.locator("#connect-facebook").getByLabel("Page access token").fill("e2e-token-0123456789abcd");
  await page.locator("#connect-facebook").getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-facebook")).toContainText("Gojoline Page 123456789012345");
  await expect(page.locator("#connect-facebook").getByRole("status")).toHaveText("Connected.");
  // The token never comes back to the page.
  expect(await page.content()).not.toContain("e2e-token-0123456789abcd");
  // A crafted link can't put its own words in the error box: only our own messages show.
  await page.goto("/en/admin?tab=posts&pd=failed&cn=facebook&why=Paste%20your%20token%20at%20evil.example#connect-facebook");
  await expect(page.locator("#connect-facebook").getByRole("alert")).toHaveText("That didn't work. Check the details and try again.");
  await page.goto("/en/admin?tab=posts&view=connections");
  // Disconnect (asks first).
  page.once("dialog", (d) => d.accept());
  await page.locator("#connect-facebook").getByRole("button", { name: /^Disconnect/ }).click();
  await expect(page.locator("#connect-facebook")).toContainText("Not connected");

  await page.getByRole("button", { name: "Plan the next 7 days" }).click();
  // The week strip shows seven days, each with its post's kind and state; drafts open in To review.
  const week = page.getByRole("list", { name: "The next 7 days" });
  await expect(week.getByRole("listitem")).toHaveCount(7);
  await expect(page.getByRole("navigation", { name: "Posts" }).getByRole("link", { name: /^To review/ })).toHaveAttribute("aria-current", "page");
  await expect(page.locator("main").getByRole("status").filter({ hasText: /new posts planned|already has a post/ })).toBeVisible();
  const card = page.locator("li[id^=post-]").filter({ has: page.locator("img") }).first();
  await expect(card).toBeVisible();
  // A template post shows the template's picture.
  await expect(page.locator("li[id^=post-] img").first()).toBeVisible();

  // Edit the Amharic caption and save.
  await card.locator("summary").filter({ hasText: "Edit and more" }).click();
  await card.getByLabel("Caption in English").fill("Your website, from one message. Start free.");
  await card.getByRole("button", { name: "Save" }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /^Saved\.$/ })).toBeVisible();
  const id = await card.getAttribute("id");
  const same = page.locator(`li#${id}`);
  await expect(same).toContainText("Your website, from one message. Start free.");
  // English only: there is no Amharic caption to review.
  await expect(same.getByLabel("Caption in Amharic")).toHaveCount(0);

  // The posting kit has each network's text with its tracked link.
  await same.locator("summary").filter({ hasText: "Edit and more" }).click();
  await expect(same.getByLabel("Text for TikTok")).toHaveValue(/utm_source=tiktok/);
  await expect(same.getByRole("link", { name: "Download the picture or video" })).toHaveAttribute("href", /\/api\/admin\/posts\/.+\/media\?download=1/);

  // A video of the template (the e2e stand-in renderer), kept as the post's media.
  await same.getByRole("button", { name: /^Make video/ }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /^Done\.$/ })).toBeVisible();
  await expect(page.locator(`li#${id} video`)).toBeVisible();
  await page.locator(`li#${id} summary`).filter({ hasText: "Edit and more" }).click();
  await expect(page.locator(`li#${id}`).getByRole("button", { name: /^Make the video again/ })).toBeVisible();

  // Post now: approved and sent to the channel.
  // Posting to the public channel asks first.
  page.once("dialog", (d) => d.accept());
  await same.getByRole("button", { name: /^Post now/ }).click();
  await expect(page.locator("main").getByRole("status").filter({ hasText: /^Done\.$/ })).toBeVisible();
  // It moves to the Sent tab, with each network's result.
  await page.getByRole("navigation", { name: "Posts" }).getByRole("link", { name: /^Sent/ }).click();
  await expect(page.locator(`li#${id}`)).toContainText("Sent to Telegram");

  // Approve all: the rest of the drafts move to Scheduled.
  await page.getByRole("navigation", { name: "Posts" }).getByRole("link", { name: /^To review/ }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /^Approve all/ }).click();
  await expect(page).toHaveURL(/view=scheduled/);
  await expect(page.locator("main").getByRole("status").filter({ hasText: /posts approved/ })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("only admins can see post media", async ({ page }) => {
  await signIn(page);
  expect((await page.request.get("/api/admin/posts/00000000-0000-4000-8000-000000000000/media")).status()).toBe(404);
  expect((await page.goto("/en/admin?tab=posts"))?.status()).toBe(404);
});
