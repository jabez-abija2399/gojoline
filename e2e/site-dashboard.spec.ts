import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

const PHONE_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";

/** Signs in, builds a site from one message and publishes it. Returns the project id. */
async function publishedSite(page: Page, info: TestInfo, prefix: string): Promise<string> {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Buna");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  const projectId = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Your site's address")).toHaveValue(/\w/);
  await page.getByLabel("Your site's address").fill(`${prefix}-${info.project.name}-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  return projectId;
}

/** What the published site sends: its own origin and its key (looked up through an e2e-only route). */
async function siteCredentials(page: Page, projectId: string) {
  const res = await page.request.get(`/api/test/site?projectId=${projectId}`);
  expect(res.status()).toBe(200);
  return (await res.json()) as { siteKey: string; origin: string };
}

test("home: live card, share sheet, QR poster, private visitor numbers and the next step", async ({ page }, info) => {
  const projectId = await publishedSite(page, info, "home");
  const { siteKey, origin } = await siteCredentials(page, projectId);

  // Two visitors as the site's beacon sends them (text/plain, key in the body); a third request is refused.
  const visit = (ref: string, ip: string, extra: Record<string, string> = {}) =>
    page.request.post(`/api/public/sites/${projectId}/visits`, { headers: { Origin: origin, "Content-Type": "text/plain", "User-Agent": PHONE_UA, "X-Real-IP": ip }, data: JSON.stringify({ path: "/", ref, key: siteKey, ...extra }) });
  expect((await visit("https://t.me/", "10.0.0.1")).status()).toBe(204);
  expect((await visit("", "10.0.0.2", { src: "qr" })).status()).toBe(204);
  expect((await page.request.post(`/api/public/sites/${projectId}/visits`, { headers: { Origin: "https://evil.example", "Content-Type": "text/plain" }, data: JSON.stringify({ path: "/", ref: "", key: siteKey }) })).status()).toBe(403);

  await page.goto(`/en/dashboard/${projectId}`);
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Your site is live" })).toBeVisible();
  // The owner's own visits through "Open" are not counted (#me).
  await expect(page.getByRole("link", { name: /^Open/ })).toHaveAttribute("href", /#me$/);

  await page.getByRole("button", { name: "Share", exact: true }).click();
  const share = page.getByRole("dialog", { name: "Share your site" });
  await expect(share.getByRole("link", { name: /Telegram/ })).toHaveAttribute("href", /^https:\/\/t\.me\/share\/url\?url=https/);
  await expect(share.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await expect(share.getByRole("link", { name: /Facebook/ })).toHaveAttribute("href", /facebook\.com\/sharer/);
  await expect(share.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await share.getByRole("button", { name: "Close" }).click();
  await expect(share).toBeHidden();

  await page.getByRole("button", { name: "QR code", exact: true }).click();
  const qr = page.getByRole("dialog", { name: "Your QR code" });
  await expect(qr.getByRole("img", { name: /QR code that opens/ })).toBeVisible();
  const download = page.waitForEvent("download");
  await qr.getByRole("button", { name: "Download poster" }).click();
  expect((await download).suggestedFilename()).toMatch(/-qr\.png$/);
  await qr.getByRole("button", { name: "Close" }).click();

  const kpi = (label: string) => page.getByRole("listitem").filter({ hasText: new RegExp(`^${label}`) });
  await expect(kpi("People who visited")).toContainText("about 2");
  await expect(kpi("People who visited")).toContainText("your first week");
  await expect(kpi("Waiting for an answer")).toContainText("All answered");
  await expect(page.getByText("Counted privately: no cookies, no tracking.")).toBeVisible();
  const sources = page.getByRole("region", { name: "Where visitors came from" });
  await expect(sources.getByText("Telegram")).toBeVisible();
  await expect(sources.getByText("50%").first()).toBeVisible();
  await expect(sources.getByText("QR code")).toBeVisible();
  // One next step; the rest waits behind "All steps".
  const next = page.getByRole("region", { name: "Next step" });
  await expect(next.getByText("Add your phone and opening hours").first()).toBeVisible();
  await expect(next.getByRole("link", { name: "Do it now" })).toHaveAttribute("href", /tab=info/);
  await next.getByText(/All steps \(2 of 6 done\)/).click();
  await expect(next.getByRole("link", { name: /Get messages on Telegram/ })).toHaveAttribute("href", /tab=settings#telegram/);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("messages: New → Replied → Done, with call and WhatsApp links, filters and delete", async ({ page }, info) => {
  const projectId = await publishedSite(page, info, "msgs");
  expect((await page.request.post("/api/test/answers", { data: { projectId, count: 3 } })).status()).toBe(200);
  await page.goto(`/en/dashboard/${projectId}?tab=answers`);
  // Old links land on the renamed section; the badge counts New.
  await expect(page.getByRole("link", { name: /Messages 3 waiting for an answer/i })).toHaveAttribute("aria-current", "page");
  const card = page.getByRole("listitem").filter({ hasText: "Abebe Kebede" });
  await expect(card.getByText("New", { exact: true })).toBeVisible();
  // Call and the status step are the visible pair; SMS and WhatsApp wait behind "Other ways to reply".
  await expect(card.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+251911000000");
  await card.getByText("Other ways to reply").click();
  await expect(card.getByRole("link", { name: "SMS" })).toHaveAttribute("href", "sms:+251911000000");
  await expect(card.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/251911000000");
  // No Telegram-by-phone button (it often fails quietly); only a real username gets one.
  await expect(card.getByRole("link", { name: /Telegram/ })).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);

  await card.getByRole("button", { name: "Mark as replied" }).click();
  await expect(page.getByText("Marked as Replied.")).toBeVisible();
  // Focus moves on to the next message (or the list heading after the last one).
  await expect(page.locator("h2:focus, h3:focus")).toHaveCount(1);
  await expect(card.getByText("Replied", { exact: true })).toBeVisible();
  await card.getByRole("button", { name: "Mark as done" }).click();
  await expect(card.getByText("Done", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "Open again" })).toBeVisible();

  await page.getByRole("button", { name: /^Done 1/ }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Abebe Kebede" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Hana Tesfaye" })).toHaveCount(0);
  await page.getByRole("button", { name: /^New 2/ }).click();
  const hana = page.getByRole("listitem").filter({ hasText: "Hana Tesfaye" });
  await hana.getByText("More").click();
  await hana.getByRole("button", { name: /Delete message from Hana Tesfaye/ }).click();
  const confirm = page.getByRole("dialog", { name: "Delete this message?" });
  await expect(confirm).toContainText("This can't be undone.");
  await confirm.getByRole("button", { name: "Delete message" }).click();
  await expect(page.getByText("Message deleted.")).toBeVisible();
  await expect(hana).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("link", { name: /Messages 1 waiting for an answer/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download as a spreadsheet" })).toHaveAttribute("href", /submissions\/export$/);
  const csv = await (await page.request.get(`/api/projects/${projectId}/submissions/export`)).text();
  expect(csv).toContain('"date","form","status"');
  expect(csv).toContain('"booking","done"');
  await expectNoHorizontalScroll(page);
});

test("business info: saved without AI and served by the public Data API", async ({ page }, info) => {
  const projectId = await publishedSite(page, info, "info");
  const { siteKey, origin } = await siteCredentials(page, projectId);
  await page.goto(`/en/dashboard/${projectId}?tab=info`);
  await page.getByLabel("Phone number").fill("0911 22 33 44");
  await page.getByLabel("Telegram username").fill("@bole_buna");
  await page.getByLabel("Monday").selectOption("open");
  await page.getByLabel("Monday: Opens").fill("07:30");
  await page.getByLabel("Monday: Closes").fill("19:00");
  await page.getByRole("button", { name: "Use Monday's hours for Tuesday to Friday" }).click();
  await page.getByLabel("Sunday").selectOption("closed");
  await page.getByLabel("Show a banner at the top of your site").check();
  // Sites in two languages get one banner box per language.
  await page.getByLabel(/^Banner (text|in English)$/).fill("Free delivery in Bole");
  // The preview shows what the site will.
  const preview = page.getByRole("complementary", { name: /Preview/ });
  await expect(preview.getByText("Free delivery in Bole")).toBeVisible();
  await expect(preview.getByText("Mon–Fri")).toBeVisible();
  await expect(preview.getByText(/7:30\sAM–7:00\sPM/)).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved. Your site shows it within a minute.")).toBeVisible();

  // Words that try to steal from visitors never go live.
  await page.getByLabel(/^Banner (text|in English)$/).fill("Enter your PIN to confirm your account");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("This text can't go on your site. Please change it.")).toBeVisible();
  await page.getByLabel(/^Banner (text|in English)$/).fill("Free delivery in Bole");

  // A bad number is refused with a plain reason.
  await page.getByLabel("WhatsApp number").fill("12");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Check the WhatsApp number, like 0911 22 33 44.")).toBeVisible();

  const res = await page.request.get(`/api/public/sites/${projectId}/info?key=${encodeURIComponent(siteKey)}`, { headers: { Origin: origin } });
  expect(res.status()).toBe(200);
  expect(res.headers()["access-control-allow-origin"]).toBe(origin);
  expect(res.headers()["cache-control"]).toContain("max-age=60");
  const body = await res.json();
  expect(body).toEqual({
    offline: false,
    business: {
      phone: "0911 22 33 44",
      telegram: "bole_buna",
      hours: [
        { days: { en: "Mon–Fri", am: "ሰኞ–ዓርብ" }, time: { en: expect.stringMatching(/^7:30\sAM–7:00\sPM$/), am: expect.stringMatching(/^7:30/) } },
        { days: { en: "Sun", am: "እሁድ" }, time: { en: "Closed", am: "ዝግ" } },
      ],
    },
    announcement: [{ en: "Free delivery in Bole" }],
  });
  // Other sites and requests without the key get nothing.
  expect((await page.request.get(`/api/public/sites/${projectId}/info?key=${encodeURIComponent(siteKey)}`, { headers: { Origin: "https://evil.example" } })).status()).toBe(403);
  expect((await page.request.get(`/api/public/sites/${projectId}/info`, { headers: { Origin: origin } })).status()).toBe(403);
  await page.reload();
  await expect(page.getByLabel("Phone number")).toHaveValue("0911 22 33 44");
});

test("settings: take the site offline and put it back, and restore an earlier version", async ({ page }, info) => {
  const projectId = await publishedSite(page, info, "rest");
  // A second version to go back from.
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Make the title warmer");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 2").first()).toBeVisible();
  const { siteKey, origin } = await siteCredentials(page, projectId);
  const infoApi = () => page.request.get(`/api/public/sites/${projectId}/info?key=${encodeURIComponent(siteKey)}`, { headers: { Origin: origin } });

  await page.goto(`/en/dashboard/${projectId}?tab=telegram`);
  const v1 = await page.getByRole("region", { name: "Earlier versions" }).getByRole("button", { name: /^Restore the version from / }).getAttribute("aria-label");
  await expect(page.getByRole("navigation", { name: "Your site's dashboard" }).getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Get messages on Telegram" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await page.getByRole("button", { name: "Take site offline" }).click();
  const off = page.getByRole("dialog", { name: "Take your site offline?" });
  await expect(off).toContainText("Your messages, photos and pages stay.");
  await off.getByRole("button", { name: "Take offline" }).click();
  await expect(page.getByText("Your site is resting now.")).toBeVisible();
  await expect(page.getByText("Resting", { exact: true })).toBeVisible();
  expect((await (await infoApi()).json()).offline).toBe(true);
  // Forms stop while it rests.
  const form = await page.request.post(`/api/public/sites/${projectId}/forms/booking`, { headers: { Origin: origin, "X-Site-Key": siteKey, "Content-Type": "application/json" }, data: { answers: {}, _hp: "", _ms: 5000 } });
  expect(form.status()).toBe(404);

  await page.getByRole("button", { name: "Put back online" }).click();
  await page.getByRole("dialog", { name: "Put your site back online?" }).getByRole("button", { name: "Put back online" }).click();
  await expect(page.getByText("Your site is back online.")).toBeVisible();
  expect((await (await infoApi()).json()).offline).toBe(false);

  // Earlier versions: restoring says what it keeps, then the list shows the new version.
  const versions = page.getByRole("region", { name: "Earlier versions" });
  await versions.getByRole("button", { name: v1! }).click();
  const ask = page.getByRole("dialog", { name: /^Go back to the version from / });
  await expect(ask).toContainText("Messages and photos are not deleted.");
  await ask.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(versions.getByText(/^Your site is back to the version from .+\. Publish to show it on your live site\.$/)).toBeVisible();
  await expect(versions.getByText("Went back to an earlier version")).toBeVisible();
  await versions.getByRole("button", { name: "Publish now" }).click();
  await expect(versions.getByText("Published. Your live site is up to date.")).toBeVisible();
});

test("every section in Amharic: no sideways scroll and no serious accessibility issues", async ({ page }, info) => {
  test.setTimeout(120_000);
  const projectId = await publishedSite(page, info, "am");
  expect((await page.request.post("/api/test/answers", { data: { projectId, count: 2 } })).status()).toBe(200);
  for (const tab of ["home", "messages", "info", "settings"]) {
    await page.goto(`/am/dashboard/${projectId}?tab=${tab}`);
    await expect(page.getByRole("link", { name: "ድረ-ገጽዎን በAI ይቀይሩ" })).toBeVisible();
    await expect(page.locator("[aria-current=page]")).toBeVisible();
    // Wait for the section's own content (client sections load after the page).
    await expect(page.locator("[role=status] .animate-pulse, div[role=status][aria-label]")).toHaveCount(0, { timeout: 10_000 });
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
  }
  // A draft site's Home leads with publishing.
  await page.goto("/am/build");
  await page.getByRole("button", { name: /አዲስ ድረ-ገጽ/ }).first().click();
  await page.waitForURL(/\/build\/[0-9a-f-]{36}$/);
  const draft = page.url().split("/").pop()!;
  await page.goto(`/am/dashboard/${draft}`);
  await expect(page.getByRole("link", { name: "ድረ-ገጽዎን ያትሙ" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
});
