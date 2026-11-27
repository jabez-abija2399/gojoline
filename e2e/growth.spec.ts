import { expect, test, type Browser, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, openAccountMenu, billingTab, payFor, signIn, unfold } from "./helpers";

/** A second browser on the same device as the test's own page. */
async function newPage(browser: Browser, opts: { userAgent?: string } = {}) {
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent: opts.userAgent ?? userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  return { page: await ctx.newPage(), ctx, close: () => ctx.close() };
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
  const href = /<gojoline-badge[^>]*>[\s\S]*?<a href="([^"]+)"/.exec(free)?.[1];
  expect(href).toBeTruthy();
  const url = new URL(href!.replace(/&amp;/g, "&"));
  expect(url.hostname).not.toBe("gojoline.com");
  expect(url.pathname).toBe("/en");
  expect(url.searchParams.get("ref")).toMatch(/^site_badge-bakery/);
  expect(url.searchParams.get("utm_source")).toBe("gojoline_badge");

  // The site's own CSS can't hide it: open the published page with hostile styles added.
  const hostile = "<style>gojoline-badge,body>*:not(#root),footer~*{display:none!important;visibility:hidden!important;opacity:0!important;transform:scale(0)!important;height:0!important;max-height:0!important;overflow:hidden!important;clip-path:inset(50%)!important;position:absolute!important;left:-9999px!important}a{display:none!important;font-size:0!important;color:transparent!important}</style>";
  await page.route("https://free-site.test/", (r) => r.fulfill({ contentType: "text/html", body: free.replace("</head>", `${hostile}</head>`).replace(/<script[^>]*><\/script>/g, "") }));
  await page.goto("https://free-site.test/");
  const badge = page.locator("gojoline-badge").getByRole("link", { name: "Made with Gojoline" });
  await expect(badge).toBeVisible();
  const box = await badge.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(40);
  expect(box!.width).toBeGreaterThan(100);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(await badge.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  await page.goto(`/en/build/${projectId}`);

  // On Starter the same site publishes without it.
  await page.request.post("/api/test/credits", { data: { left: 10, plan: "starter" } });
  await page.reload();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish my latest changes" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  // The showcase-and-posts choice is offered here, off by default, and saves.
  const share = page.getByRole("dialog").getByRole("checkbox", { name: /Show my site in the Gojoline showcase and posts/ });
  await expect(share).not.toBeChecked();
  await share.check();
  await expect(page.getByRole("dialog").getByText("Saved", { exact: false })).toBeVisible();
  expect((await (await page.request.get(`/api/projects/${projectId}/showcase`)).json()).on).toBe(true);
  await share.uncheck();
  await expect.poll(async () => (await (await page.request.get(`/api/projects/${projectId}/showcase`)).json()).on).toBe(false);
  const paid = await (await page.request.get(`/api/test/published?projectId=${projectId}`)).text();
  expect(paid).not.toContain("data-gojoline-badge");
});

test("a business joins through an invite link; when the admin approves its first payment both are thanked", async ({ page, browser }) => {
  // The inviter finds the link from the sidebar.
  await signIn(page);
  await openAccountMenu(page);
  await page.getByRole("link", { name: "Invite a business" }).click();
  await expect(page.getByRole("heading", { name: "Invite a business" })).toBeVisible();
  const link = await page.getByLabel("Your invite link").inputValue();
  expect(link).toMatch(/\/en\?ref=u_[a-z2-9]{8}$/);
  await expect(page.getByText("No one has joined with your link yet.")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  // The new owner opens the link, signs up and pays for Starter.
  // Another phone (another browser) on the same network as the inviter: allowed, flagged for the admin.
  const invited = await newPage(browser, { userAgent: "Mozilla/5.0 (Linux; Android 14; Gojoline e2e invited) Chrome/130.0 Mobile" });
  // First came from TikTok, then the invite link: the invite still counts.
  await invited.page.goto("/en?utm_source=tiktok");
  await invited.page.goto(new URL(link).pathname + new URL(link).search);
  // Another business: a different email domain (the same company's domain counts as inviting yourself).
  await signIn(invited.page, { contact: `invited-${Date.now()}-${test.info().project.name}@example.org` });
  await invited.page.goto("/en/billing");
  await payFor(invited.page, "starter_month");
  const reference = `REF${Date.now().toString(36).toUpperCase()}${test.info().project.name.length}`;
  await invited.page.getByLabel("Transaction number").fill(reference);
  await invited.page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await invited.page.getByRole("button", { name: "Send for checking" }).click();
  await expect(invited.page.getByRole("status").filter({ hasText: "Thank you" })).toBeVisible();
  // The first-touch cookie has done its job.
  expect((await invited.ctx.cookies()).some((c) => c.name.endsWith("gojo_src"))).toBe(false);

  // The admin approves it, then sees the invite and where the sign-up came from.
  const admin = await newPage(browser);
  await signIn(admin.page, { contact: `admin-e2e-grow-${test.info().project.name}@example.com` });
  await admin.page.goto("/en/admin?tab=payments");
  const item = admin.page.getByRole("listitem").filter({ hasText: reference });
  await expect(item).toContainText(/Invited by .*approving this thanks both/);
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
    await p.goto("/en/billing?tab=history");
    // Folded on phones; unfold again if a late render folded it back.
    await expect(async () => {
      await unfold(p, /History of your changes/);
      await expect(p.getByText("Thank-you for an invite")).toBeVisible({ timeout: 1000 });
    }).toPass();
  }
  await billingTab(page, "Invite");
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

test("sector pages render in English and Amharic, accessible and without sideways scroll", async ({ page }) => {
  await page.goto("/en/website-for/church");
  await expect(page.getByRole("heading", { level: 1, name: "A website for your church in Ethiopia" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What your site does for you" })).toBeVisible();
  await expect(page.locator("main details")).toHaveCount(3);
  await expect(page.getByText("Websites for Churches")).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with this template" })).toHaveCount(2);
  await expect(page.getByRole("link", { name: "Start with this template" }).first()).toHaveAttribute("href", "/en/sign-in?next=/en/build");
  await expect(page.getByRole("link", { name: /See the whole example/ })).toHaveAttribute("href", "/en/templates/worship");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent()) ?? "{}") as { "@graph": { "@type": string }[] };
  expect(ld["@graph"].map((x) => x["@type"])).toEqual(["WebPage", "FAQPage"]);
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  await page.goto("/am/website-for/church");
  await expect(page.locator("html")).toHaveAttribute("lang", "am");
  await expect(page.getByRole("heading", { level: 1, name: "በኢትዮጵያ ላለች ቤተ ክርስቲያንዎ ድረ-ገጽ" })).toBeVisible();
  await expect(page.getByText("ድረ-ገጾች ለአብያተ ክርስቲያናት")).toBeVisible();
  await expect(page.getByRole("link", { name: "በዚህ አብነት ይጀምሩ" }).first()).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  // Other sectors are a tap away; unknown ones are 404.
  await page.getByRole("link", { name: "ካፌዎች" }).click();
  await expect(page).toHaveURL(/\/am\/website-for\/cafe$/);
  expect((await page.goto("/en/website-for/casino"))?.status()).toBe(404);
});

test("an admin invites owners of live sites to be featured, once", async ({ page, browser }) => {
  await signIn(page);
  await publishNewSite(page, `Invite Cafe ${Date.now().toString(36)}`);

  const admin = await newPage(browser);
  await signIn(admin.page, { contact: `admin-e2e-invite-${test.info().project.name}@example.com` });
  await admin.page.goto("/en/admin?tab=growth");
  const box = admin.page.getByRole("region", { name: "Invite owners to be featured" });
  await expect(box.getByText(/Owners to invite: \d+/)).toBeVisible();
  admin.page.once("dialog", (d) => d.accept());
  await box.getByRole("button", { name: "Send invitations" }).click();
  await expect(admin.page).toHaveURL(/fi=ok/);
  // Without a linked Telegram or verified email here, owners are counted as not reached (and tried again later).
  await expect(admin.page.getByRole("region", { name: "Invite owners to be featured" }).getByRole("status")).toContainText(/Invitations sent: \d+/);
  await expectNoSeriousA11yIssues(admin.page);
  await expectNoHorizontalScroll(admin.page);
  await admin.close();
});
