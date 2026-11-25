import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

// One shared memory store serves both projects: the full flow runs on desktop only.
/** The phone and desktop runs share one server: a plan refused because the other run is planning (one at a time) is tried again. */
async function planWeek(page: Page, name: string) {
  const start = new URL(page.url());
  start.search = "?tab=posts";
  start.hash = "";
  await expect(async () => {
    if (page.url() !== start.href) await page.goto(start.href);
    await page.getByRole("button", { name }).click();
    await page.waitForURL(/pd=/);
    expect(new URL(page.url()).searchParams.get("pd")).toBe("ok");
  }).toPass({ timeout: 30_000 });
}

test("admin plans a week of posts, edits one, posts it to Telegram, and has a posting kit", async ({ page }, info) => {
  await signIn(page, { contact: `admin-e2e-posts-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts");
  await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible();
  // One view at a time: To review, Scheduled, Videos, Sent, Connections.
  await expect(page.getByRole("navigation", { name: "Posts" }).getByRole("link")).toHaveCount(5);
  await page.getByRole("navigation", { name: "Posts" }).getByRole("link", { name: /^Connections/ }).click();
  await expect(page).toHaveURL(/view=connections/);
  const tgCard = page.locator("#connect-telegram");
  await expect(tgCard).toContainText("Connected");
  await expect(tgCard).toContainText("@gojoline_e2e");
  if (info.project.name === "mobile") {
    // Phones, in Amharic, with the cards (planned by the desktop run or here) and their sections open.
    await page.goto("/am/admin?tab=posts");
    await planWeek(page, "የሚቀጥሉትን 7 ቀናት ያቅዱ");
    await expect(page.getByRole("list", { name: "የሚቀጥሉት 7 ቀናት" }).getByRole("listitem")).toHaveCount(7);
    await page.goto("/am/admin?tab=posts&view=review");
    const first = page.locator("li[id^=post-]").first();
    await expect(first).toBeVisible();
    for (const s of await first.locator("summary").all()) await s.click();
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
    return;
  }
  // Instagram on its own (Instagram login, no Facebook Page): the token alone connects it.
  const ig = page.locator("#connect-instagram");
  await expect(ig).toContainText("Not connected");
  await ig.locator("summary").click();
  await ig.getByLabel("Instagram access token").fill("wrong-token-0123456789abcdef");
  await ig.getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-instagram").getByRole("alert")).toContainText("Meta didn't accept the token");
  // After a failure the form is open again, with the field marked as wrong.
  await expect(page.locator("#connect-instagram").getByLabel("Instagram access token")).toHaveAttribute("aria-invalid", "true");
  await page.locator("#connect-instagram").getByLabel("Instagram access token").fill("e2e-token-0123456789abcd");
  await page.locator("#connect-instagram").getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-instagram")).toContainText("@gojoline");
  await expect(page.locator("#connect-instagram").getByRole("status")).toHaveText("Connected.");
  // A business token (Unified login, new Meta apps): asks for the account ID when it can't find it.
  await page.locator("#connect-instagram summary").click();
  await page.locator("#connect-instagram").getByLabel("Instagram access token").fill("e2e-business-0123456789abcd");
  await page.locator("#connect-instagram").getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-instagram").getByRole("alert")).toContainText("we couldn't find your Instagram account");
  // Only the field at fault (the ID) is marked; the token was fine.
  await expect(page.locator("#connect-instagram").getByLabel("Instagram access token")).not.toHaveAttribute("aria-invalid");
  await expect(page.locator("#connect-instagram").getByLabel(/Instagram account ID/)).toHaveAttribute("aria-invalid", "true");
  await expectNoSeriousA11yIssues(page);
  await page.locator("#connect-instagram").getByLabel("Instagram access token").fill("e2e-business-0123456789abcd");
  await page.locator("#connect-instagram").getByLabel(/Instagram account ID/).fill("17841499999999999");
  await page.locator("#connect-instagram").getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-instagram").getByRole("status")).toHaveText("Connected.");
  await expect(page.locator("#connect-facebook")).toContainText("Not connected");
  // Connect Facebook from Admin: a wrong token is refused with Meta's reason, the right one connects.
  const fb = page.locator("#connect-facebook");
  await expect(fb).toContainText("Not connected");
  await fb.locator("summary").click();
  await fb.getByLabel("Page ID").fill("123456789012345");
  await fb.getByLabel("Page access token").fill("wrong-token-0123456789abcdef");
  await fb.getByRole("button", { name: "Check and save" }).click();
  await expect(page.locator("#connect-facebook").getByRole("alert")).toContainText("Meta didn't accept the token");
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

  await planWeek(page, "Plan the next 7 days");
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

  // The posting kit has each network's text: a tracked link where links work, "Link in bio" on TikTok.
  await same.locator("summary").filter({ hasText: "Edit and more" }).click();
  await expect(same.getByLabel("Text for Facebook")).toHaveValue(/utm_source=facebook/);
  await expect(same.getByLabel("Text for TikTok")).toHaveValue(/Link in bio/);
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

test("a visit from a post link shows in the Sent tab's results", async ({ page, browser }, info) => {
  test.setTimeout(60_000);
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = info.project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  const visitor = await ctx.newPage();
  // The listener is part of the page's code; the server counts each network once a day, so a repeat answers 204 too.
  await expect(async () => {
    const counted = visitor.waitForResponse((r) => r.url().endsWith("/api/track") && r.request().method() === "POST", { timeout: 6000 });
    await visitor.goto(`/en?utm_source=telegram&utm_medium=social&utm_campaign=post-${new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10)}&x=${Date.now()}`);
    expect((await counted).status()).toBe(204);
  }).toPass({ timeout: 30_000 });
  await ctx.close();

  await signIn(page, { contact: `admin-e2e-posts-reach-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts&view=sent");
  const box = page.getByRole("heading", { name: /What posts brought in/ }).locator("..");
  await expect(box.getByRole("rowheader", { name: "Telegram" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("Videos: every day's video in one place, made here or uploaded, with captions per network", async ({ page }, info) => {
  test.setTimeout(90_000);
  await signIn(page, { contact: `admin-e2e-videos-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts");
  await planWeek(page, "Plan the next 7 days");
  await page.goto("/en/admin?tab=posts&view=videos");
  await expect(page.getByRole("heading", { name: "This week's videos" })).toBeVisible();
  const cards = page.locator("li[id^=video-]");
  await expect(cards.first()).toBeVisible();
  // Make a video for a day without one (the demo renderer answers at once).
  const without = cards.filter({ hasText: "No video yet" }).first();
  const id = (await without.getAttribute("id"))!;
  await without.getByRole("button", { name: /^Make video/ }).click();
  await expect(page).toHaveURL(/view=videos/);
  await expect(page.locator(`#${id} video`)).toHaveCount(1);
  // Upload a video the admin filmed (an MP4 by its bytes; a non-video is refused).
  const target = page.locator("li[id^=video-]").filter({ hasText: "No video yet" }).first();
  const targetId = (await target.getAttribute("id"))!;
  const mp4 = Buffer.alloc(2048);
  mp4.writeUInt32BE(24, 0);
  mp4.write("ftypisom", 4);
  await target.locator("input[type=file]").setInputFiles({ name: "not-a-video.mp4", mimeType: "video/mp4", buffer: Buffer.from("<html>hello</html>") });
  await expect(target.getByText("That file isn't an MP4 video.")).toBeVisible();
  await target.locator("input[type=file]").setInputFiles({ name: "my-build.mp4", mimeType: "video/mp4", buffer: mp4 });
  await expect(page.locator(`#${targetId} video`)).toHaveCount(1);
  // Captions for the networks posted by hand.
  await expect(page.locator(`#${targetId}`).getByRole("button", { name: /Copy TikTok caption/ })).toBeVisible();
  await expect(page.locator(`#${targetId}`).getByRole("button", { name: /Copy YouTube title/ })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  // The same view in Amharic.
  await page.goto("/am/admin?tab=posts&view=videos");
  await expect(page.locator("li[id^=video-]").first()).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});
