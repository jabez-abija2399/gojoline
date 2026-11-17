import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, openAppMenu, signIn } from "./helpers";

const newContext = async (browser: import("@playwright/test").Browser) => {
  const o = test.info().project.use;
  return browser.newContext({ viewport: o.viewport, userAgent: o.userAgent, isMobile: o.isMobile, hasTouch: o.hasTouch, baseURL: o.baseURL });
};

/** The sidebar's feedback link (behind Menu on phones). */
async function feedbackLink(page: Page) {
  await openAppMenu(page);
  return page.getByRole("link", { name: /Send feedback/ });
}

test("an owner sends feedback; an admin replies and plans it; the owner sees the reply", async ({ page, browser }) => {
  // Two people with two sign-ins.
  test.setTimeout(90_000);
  const project = test.info().project.name;
  const text = `The preview stays white on my phone (${project} ${Date.now().toString(36)})`;

  // The owner finds Send feedback in the menu; the page it came from goes along.
  const owner = await signIn(page);
  await (await feedbackLink(page)).click();
  await expect(page.getByRole("heading", { name: "Send feedback", level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/en\/feedback\?from=%2Fen%2Fbuild$/);
  await expect(page.getByText("Nothing sent yet.")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  // Clear errors before anything is sent.
  const send = page.getByRole("button", { name: "Send feedback" });
  await send.click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Choose what it's about.");
  await expect(page.getByRole("radio", { name: /^Idea/ })).toBeFocused();
  await page.locator("label").filter({ hasText: "Problem" }).click();
  await page.getByLabel("Your message").fill("Hi");
  await send.click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Write at least 5 characters (2000 at most).");
  await expect(page.getByLabel("Your message")).toBeFocused();

  await page.getByLabel("Your message").fill(text);
  await page.locator("label").filter({ hasText: /^4/ }).click();
  await expect(page.getByText("Easy", { exact: true })).toBeVisible();
  await page.getByLabel("Add a screenshot (optional)").setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByText("photo.jpg")).toBeVisible();
  await send.click();
  await expect(page.locator("main").getByRole("status")).toHaveText("Thanks! Your message reached us.");
  await expect(page.locator("main").getByRole("status")).toBeFocused();
  const mine = page.getByRole("region", { name: "My feedback" }).getByRole("listitem").filter({ hasText: text });
  await expect(mine).toContainText("Sent");
  await expect(mine.getByRole("link", { name: "See your screenshot" })).toBeVisible();
  // Send another starts again at the first choice.
  await page.getByRole("button", { name: "Send another" }).click();
  await expect(page.getByRole("radio", { name: /^Idea/ })).toBeFocused();

  // The admin sees it with the owner, the page, the rating and the screenshot.
  const adminCtx = await newContext(browser);
  const admin = await adminCtx.newPage();
  await signIn(admin, { contact: `admin-e2e-fb-${project}@example.com` });
  await admin.goto("/en/admin");
  await expect(admin.getByRole("link", { name: /new feedback messages/ })).toBeVisible();
  await admin.getByRole("link", { name: /new feedback messages/ }).click();
  await expect(admin).toHaveURL(/tab=feedback&status=new/);
  const item = admin.getByRole("listitem").filter({ hasText: text });
  await expect(item).toContainText(owner.toLowerCase());
  await expect(item).toContainText("Free");
  await expect(item).toContainText("/en/build");
  await expect(item).toContainText("Ease 4 of 5");
  await expect(item.getByRole("img", { name: "Screenshot the owner sent" })).toBeVisible();
  await expect.poll(() => item.getByRole("img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expectNoSeriousA11yIssues(admin);
  // The type filter narrows the list.
  await admin.goto("/en/admin?tab=feedback&type=praise");
  await expect(admin.getByRole("listitem").filter({ hasText: text })).toHaveCount(0);
  await admin.goto("/en/admin?tab=feedback&status=new&type=problem");
  await item.getByLabel("Status").selectOption("planned");
  await item.getByLabel("Reply to the owner").fill("Thank you! We are fixing this next week.");
  await item.getByRole("button", { name: "Save" }).click();
  // Planned leaves the New list: the outcome shows at the top, with focus.
  await expect(admin.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  expect(await admin.evaluate(() => document.activeElement?.textContent ?? "")).toContain("Saved.");
  await expect(admin).toHaveURL(/status=new&type=problem&fb=saved/);
  await expect(admin.getByRole("listitem").filter({ hasText: text })).toHaveCount(0);
  await admin.goto("/en/admin?tab=feedback&status=planned");
  await expect(item).toContainText("Planned");
  await expect(item.getByLabel("Reply to the owner")).toHaveValue("Thank you! We are fixing this next week.");
  await expect(item).toContainText("Not seen yet");
  // A save that keeps the card in the list comes back to the card, its status line focused.
  await item.getByRole("button", { name: "Save" }).click();
  await expect(admin).toHaveURL(/fb=unchanged.*#fb-/);
  await expect(item.getByRole("status")).toHaveText("Nothing changed.");
  await expect(item.getByRole("status")).toBeFocused();
  await adminCtx.close();

  // The owner sees a badge, then the reply and the status.
  await page.goto("/en/build");
  const link = await feedbackLink(page);
  await expect(link).toHaveAccessibleName(/1 new reply/);
  await link.click();
  await expect(mine).toContainText("Planned");
  await expect(mine).toContainText("New reply");
  await expect(mine).toContainText("Thank you! We are fixing this next week.");
  // On this page the menu has no badge: the reply is right here.
  await expect(await feedbackLink(page)).not.toHaveAccessibleName(/new reply/);
  await page.keyboard.press("Escape");
  await expectNoSeriousA11yIssues(page);
  // Seen once (the page tells the server after it shows): no badge next time.
  await expect(async () => {
    await page.reload();
    await expect(mine).toContainText("Thank you! We are fixing this next week.", { timeout: 2000 });
    await expect(mine).not.toContainText("New reply", { timeout: 500 });
  }).toPass();
});

test("feedback in Amharic fits the screen and another owner's screenshot stays private", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await signIn(page, { lang: "am" });
  await page.goto("/am/feedback");
  await expect(page.getByRole("heading", { name: "አስተያየት ይላኩ", level: 1 })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("id", "main");
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  await page.locator("label").filter({ hasText: "ሀሳብ" }).click();
  await page.getByLabel("መልዕክትዎ").fill("ምናሌውን በአማርኛ ማስተካከል ቢቻል ጥሩ ነው");
  await page.getByLabel("የስክሪን ፎቶ ያያይዙ (አማራጭ)").setInputFiles("e2e/fixtures/photo.jpg");
  await page.getByRole("button", { name: "አስተያየቱን ይላኩ" }).click();
  await expect(page.locator("main").getByRole("status")).toHaveText("እናመሰግናለን! መልዕክትዎ ደርሶናል።");
  const shot = page.getByRole("link", { name: "የስክሪን ፎቶዎን ይዩ" });
  await expect(shot).toBeVisible();
  await expectNoHorizontalScroll(page);
  const href = (await shot.getAttribute("href"))!;
  const full = await page.request.get(href);
  expect(full.status()).toBe(200);
  expect(full.headers()["cache-control"]).toBe("private, max-age=86400, immutable");
  const thumb = await page.request.get(`${href}?size=thumb`);
  expect(thumb.status()).toBe(200);
  expect(thumb.headers()["content-type"]).toBe("image/webp");

  // Someone else signed in gets the same answer as for a missing picture.
  const otherCtx = await newContext(browser);
  const other = await otherCtx.newPage();
  await signIn(other);
  expect((await other.request.get(href)).status()).toBe(404);
  // And a foreign site can't send feedback in an owner's name.
  const forged = await other.request.post("/api/feedback", { headers: { origin: "https://evil.example" }, multipart: { type: "idea", message: "Hello there", locale: "en", device: "phone" } });
  expect(forged.status()).toBe(403);
  await otherCtx.close();
});
