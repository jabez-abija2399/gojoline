import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn, unfold } from "./helpers";

// Runs against the deterministic demo AI (E2E=1); request sizes come from the word list there.
async function newSite(page: Page, lang: "en" | "am" = "en") {
  await signIn(page, { lang });
  await page.goto(`/${lang}/build`);
  await page.getByRole("button", { name: lang === "en" ? "Start a new site" : "አዲስ ድረ-ገጽ ይጀምሩ" }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/build/[0-9a-f-]{36}$`));
}

const chat = (page: Page) => page.getByRole("textbox", { name: /Your message|መልዕክትዎ/ });
async function say(page: Page, text: string) {
  await chat(page).fill(text);
  await chat(page).press("Enter");
}
const log = (page: Page) => page.getByRole("log", { name: /Chat|ውይይት/ });

function newContext(browser: import("@playwright/test").Browser) {
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  return browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
}

test("a bigger request asks first, then uses its changes; low and zero changes are explained", async ({ page }) => {
  await newSite(page);
  await say(page, "Selam Coffee");
  // The first build is free, whatever its size.
  await expect(log(page).getByText("Free first build · 10 changes left")).toBeVisible();

  await say(page, "Add a new page for our menu");
  const ask = page.getByRole("group", { name: /uses 2 of your changes/ });
  await expect(ask).toContainText("This is a medium change (a new section or page) and uses 2 of your changes. Go ahead?");
  // The question takes focus, so it is read out and can be answered at once.
  await expect(ask.getByRole("button", { name: "Go ahead" })).toBeFocused();
  await expect(ask).toContainText("You have 10 changes left.");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  await ask.getByRole("button", { name: "Go ahead" }).click();
  // The card is gone: focus is in the message box, not lost on the page.
  await expect(chat(page)).toBeFocused();
  await expect(log(page).getByText("Used 2 changes · 8 left")).toBeVisible();
  await expect(page.getByRole("link", { name: "8 changes left" })).toBeVisible();

  // "Make it smaller" puts the request back, unsent and unpaid.
  await say(page, "Redesign the whole website");
  await page.getByRole("group", { name: /uses 4 of your changes/ }).getByRole("button", { name: "Make it smaller" }).click();
  await expect(chat(page)).toHaveValue("Redesign the whole website");
  await expect(chat(page)).toBeFocused();
  await expect(log(page).getByText(/Ask for one part at a time/)).toBeVisible();
  await chat(page).press("Enter");
  // A new message while a question waits drops the waiting request from the chat.
  await say(page, "Make the title bigger");
  await expect(page.getByRole("group", { name: /uses 4 of your changes/ })).toHaveCount(0);
  await expect(log(page).getByText("Used 1 change · 7 left")).toBeVisible();
  await say(page, "Redesign the whole website");
  await page.getByRole("group", { name: /uses 4 of your changes/ }).getByRole("button", { name: "Go ahead" }).click();
  await expect(log(page).getByText("Used 4 changes · 3 left")).toBeVisible();

  await expect(page.getByText("3 changes left this month")).toBeVisible();
  await expect(page.getByRole("link", { name: "Get more" })).toHaveAttribute("href", "/en/billing");
  await expectNoSeriousA11yIssues(page);

  // More than is left: never charged, and it says what it needs.
  await say(page, "Redesign the whole website");
  await expect(log(page).getByText("This change needs 4 changes and you have 3.", { exact: false })).toBeVisible();
  for (const [name, left] of [["Buna One", 2], ["Buna Two", 1], ["Buna Three", 0]] as const) {
    await say(page, name);
    await expect(log(page).getByText(`Used 1 change · ${left} left`)).toBeVisible();
  }
  // The run that used the last change offers more, once.
  const upgrade = page.getByRole("dialog", { name: "You've used all your AI changes" });
  await expect(upgrade).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(upgrade).toBeHidden();
  await expect(page.getByText(/No changes left\. Buy more, or wait until \d+ \w+ for your monthly changes\./)).toBeVisible();
  await expect(page.getByRole("link", { name: "Buy more changes" })).toHaveAttribute("href", "/en/billing");
  // With nothing left, the suggestions make way for the note.
  await expect(page.getByRole("list", { name: "What next?" })).toHaveCount(0);
  await expectNoHorizontalScroll(page);

  // The Plan page lists every movement, newest first.
  await page.goto("/en/billing");
  // Phones fold the history away.
  await unfold(page, /History of your changes/);
  const history = page.getByRole("list", { name: "Changes added and used" });
  await expect(history.getByRole("listitem").first()).toContainText("Change to your site, small");
  await expect(history.getByRole("listitem").filter({ hasText: "Change to your site, large" })).toContainText("Redesign the whole website");
  await expect(history.getByRole("listitem").filter({ hasText: "Change to your site, medium" })).toContainText("−2");
  await expect(history.getByRole("listitem").filter({ hasText: "First build of a site (free)" })).toHaveCount(1);
  await expect(history.getByRole("listitem").filter({ hasText: "Monthly changes" })).toContainText("+10");
  await expect(page.getByText(/10 new monthly changes arrive on/)).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("Amharic: the bigger-change question and the Plan page's changes", async ({ page }) => {
  await newSite(page, "am");
  await say(page, "Selam Coffee");
  await expect(log(page).getByText(/ነጻ የመጀመሪያ ግንባታ/)).toBeVisible();
  await say(page, "አዲስ ገጽ ለምግብ ዝርዝራችን ጨምር");
  const ask = page.getByRole("group", { name: /2 ለውጦች ይወስዳል/ });
  await expect(ask.getByRole("button", { name: "ይቀጥሉ" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  await page.goto("/am/billing");
  await expect(page.getByRole("heading", { name: "አንድ ጥያቄ ስንት ለውጥ ይወስዳል" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "የለውጦችዎ ታሪክ" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("an admin changes Business's monthly changes and the pricing and Plan pages show it", async ({ page }) => {
  await signIn(page, { contact: `admin-e2e-cr-${test.info().project.name}@example.com` });
  await page.goto("/en/admin?tab=settings");
  const form = page.locator("form").filter({ has: page.getByRole("heading", { name: "Changes (credits)" }) });
  await expect(form.getByText("Changes take effect from the next monthly top-up; nobody loses changes they already have.", { exact: false })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  const business = form.getByRole("group", { name: "Changes a month" }).getByLabel("Business");
  await business.fill("lots");
  await form.getByRole("button", { name: "Save changes settings" }).click();
  await expect(form.getByRole("alert")).toContainText("check the highlighted field");
  await expect(business).toHaveAttribute("aria-invalid", "true");
  // The free first build's cost cap is a setting too, with a hard upper limit of US$2.
  const firstCap = form.getByLabel("AI cost cap for a free first build (US$)");
  await expect(firstCap).toHaveValue("0.75");
  // What was typed stays after an invalid save.
  await expect(business).toHaveValue("lots");
  await business.fill("175");
  await firstCap.fill("5");
  await form.getByRole("button", { name: "Save changes settings" }).click();
  await expect(firstCap).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Enter an amount from US$0.10 to US$2.00.").first()).toBeVisible();
  await expect(firstCap).toHaveValue("5");
  await expect(business).toHaveValue("175");
  // Both test projects save the same numbers, so they can run side by side.
  await firstCap.fill("0.75");
  await form.getByRole("button", { name: "Save changes settings" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved.");

  await page.goto("/en/pricing");
  const row = page.getByRole("table", { name: "What each plan includes" }).getByRole("row", { name: /AI changes a month/ });
  await expect(row.getByRole("cell").nth(2)).toHaveText("175");
  await expect(page.getByText("175 AI changes a month; unused ones roll over")).toBeVisible();
  await page.goto("/en/billing");
  await expect(page.locator("li").filter({ has: page.getByRole("heading", { name: "Business", level: 3 }) })).toContainText("175 AI changes a month");

  await page.goto("/am/admin?tab=settings");
  await expect(page.getByRole("heading", { name: "ለውጦች (ክሬዲቶች)" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("discount code: an admin makes one, the owner sees the price before sending, the admin sees the discount", async ({ page, browser }) => {
  await signIn(page, { contact: `admin-e2e-disc-${test.info().project.name}@example.com` });
  await page.goto("/en/admin?tab=discounts");
  const code = `E2E${test.info().project.name === "mobile" ? "M" : "D"}${Date.now().toString(36).toUpperCase()}`.slice(0, 20);
  const make = page.locator("form").filter({ has: page.getByRole("heading", { name: "New code" }) });
  await make.getByLabel("Code (A–Z and 0–9, 6 to 20)").fill(code.toLowerCase());
  await make.getByLabel("Percent (1 to 90)").fill("10");
  await make.getByRole("button", { name: "Make code" }).click();
  await expect(make.getByRole("status")).toHaveText("Code made.");
  const listed = page.getByRole("list", { name: "Discount codes and their uses" }).getByRole("listitem").filter({ hasText: code });
  await expect(listed).toContainText("10% off");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  const ctx = await newContext(browser);
  const owner = await ctx.newPage();
  await signIn(owner);
  await owner.goto("/en/billing");
  await owner.getByLabel("What are you paying for?").selectOption("starter_month");
  await owner.getByRole("button", { name: "Have a code?" }).click();
  const box = owner.getByLabel("Discount code (optional)");
  await box.fill("NOSUCHCODE1");
  await owner.getByRole("button", { name: "Apply" }).click();
  await expect(owner.getByRole("alert").filter({ hasText: "We don't know that code." })).toBeVisible();
  await box.fill(code.toLowerCase());
  await owner.getByRole("button", { name: "Apply" }).click();
  await expect(owner.getByText("You pay 449 Birr")).toBeVisible();
  // The breakdown: price, discount, to pay.
  await expect(owner.getByText("−50 Birr")).toBeVisible();
  await expect(owner.getByText(`Code ${code}: 50 Birr off.`)).toBeVisible();
  await expectNoSeriousA11yIssues(owner);
  const reference = `D${Date.now().toString(36).toUpperCase()}${test.info().project.name.length}`;
  await owner.getByLabel("Transaction number").fill(reference);
  await owner.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await owner.getByRole("button", { name: "Send for checking" }).click();
  await expect(owner.getByRole("status").filter({ hasText: "Thank you" })).toBeFocused();
  await ctx.close();

  await page.goto("/en/admin?tab=payments");
  const item = page.getByRole("listitem").filter({ hasText: reference });
  await expect(item).toContainText("Price: 499 Birr");
  await expect(item).toContainText(`Discount: 50 Birr (${code})`);
  await expect(item).toContainText("To pay: 449 Birr");
  await item.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: reference })).toHaveCount(0);
  // Counted when approved.
  await page.goto("/en/admin?tab=discounts");
  await expect(page.getByRole("listitem").filter({ hasText: code }).getByText("Uses").locator("..")).toContainText("1");
  // Switched off, never deleted.
  await page.getByRole("listitem").filter({ hasText: code }).getByRole("button", { name: `Switch off ${code}` }).click();
  await expect(page.getByRole("listitem").filter({ hasText: code })).toContainText("Off");

  await page.goto("/am/admin?tab=discounts");
  await expect(page.getByRole("heading", { name: "የቅናሽ ኮዶች" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("launch offer: switched on in one click, struck-through prices, then no end date and a new name", async ({ page, browser }) => {
  // The offer is one site-wide setting: both test projects changing it at once would race, so the
  // whole flow runs once, and checks the phone width itself.
  test.skip(test.info().project.name !== "desktop", "one site-wide setting: runs once (checks 360 px inside)");
  await signIn(page, { contact: `admin-e2e-offer-${test.info().project.name}@example.com` });
  await page.goto("/en/admin?tab=discounts");
  const form = page.getByRole("region", { name: "Launch offer" });
  await form.getByLabel("Percent off (1 to 90)").fill("20");
  await form.getByLabel("Last day (optional)").fill("2030-12-31");
  await expect(form.getByText("Leave empty to keep it on until you switch it off.")).toBeVisible();
  // Only Business monthly (other tests check the other prices).
  const products = form.getByRole("group", { name: "Applies to" });
  for (const box of await products.getByRole("checkbox").all()) await box.uncheck();
  await products.getByLabel("Business, 1 month").check();
  await form.getByRole("button", { name: "Save offer" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved.");

  // The switch at the top shows the state and saves at once.
  await page.reload();
  const switchOn = page.getByRole("button", { name: "Switch on", exact: true });
  if (await switchOn.isVisible()) await switchOn.click();
  await expect(page.getByText("Launch offer is on: 20% off Business, 1 month, until 31 Dec")).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch off", exact: true })).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  await page.goto("/en/pricing");
  const card = page.locator("li").filter({ has: page.getByRole("heading", { name: "Business", level: 2 }) });
  await expect(card.getByText("Launch offer: 20% off until 31 Dec")).toBeVisible();
  // 1,299 less 20% = 1,039.20, rounded down to whole Birr.
  await expect(card.getByText("1,039 Birr", { exact: true })).toBeVisible();
  await expect(card.locator("s")).toContainText("was 1,299 Birr");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  await page.goto("/en/billing");
  const plan = page.locator("li").filter({ has: page.getByRole("heading", { name: "Business", level: 3 }) });
  await expect(page.getByText("Launch offer: 20% off until 31 Dec")).toBeVisible();
  await expect(plan).toContainText("1,039 Birr");
  await expect(plan.locator("s")).toContainText("was 1,299 Birr");
  await page.getByLabel("What are you paying for?").selectOption("business_month");
  await expect(page.getByText("You pay 1,039 Birr")).toBeVisible();
  await expect(page.getByText("Amount to send").first().locator("..")).toContainText("1,039 Birr");

  // An owner who runs out sees the offer price in the upgrade dialog.
  const ctx = await newContext(browser);
  const owner = await ctx.newPage();
  await newSite(owner);
  await say(owner, "Selam Coffee");
  await expect(log(owner).getByText("Free first build · 10 changes left")).toBeVisible();
  await owner.request.post("/api/test/credits", { data: { left: 0 } });
  await owner.reload();
  await say(owner, "Make the title bigger");
  const dialog = owner.getByRole("dialog", { name: "You've used all your AI changes" });
  await expect(dialog).toContainText("Launch offer: 20% off until 31 Dec");
  const biz = dialog.getByRole("listitem").filter({ has: owner.getByRole("heading", { name: "Business" }) });
  await expect(biz).toContainText("1,039 Birr");
  await expect(biz.locator("s")).toContainText("was 1,299 Birr");
  await biz.getByRole("link", { name: "Choose Business" }).click();
  await expect(owner).toHaveURL(/\/en\/billing\?product=business_month#pay-title$/);
  await expect(owner.getByLabel("What are you paying for?")).toHaveValue("business_month");
  await ctx.close();

  // No last day: on until switched off, and the public pages name no date. A new name too.
  await page.goto("/en/admin?tab=discounts");
  await form.getByLabel("Last day (optional)").fill("");
  await form.getByLabel("Name in English (optional)").fill("Holiday offer");
  await form.getByLabel("Name in Amharic (optional)").fill("የበዓል ቅናሽ");
  await form.getByRole("button", { name: "Save offer" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved.");
  await page.reload();
  await expect(page.getByText("Launch offer is on: 20% off Business, 1 month", { exact: true })).toBeVisible();

  await page.goto("/en/pricing");
  await expect(card.getByText("Holiday offer: 20% off", { exact: true })).toBeVisible();
  await expect(card).not.toContainText("until");
  await expect(card.getByText("1,039 Birr", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/am/pricing");
  await expect(page.getByText("የበዓል ቅናሽ፦ የ20% ቅናሽ").first()).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  // Back to the default name, still with no end date (other runs and tests see the usual wording).
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/en/admin?tab=discounts");
  await form.getByLabel("Name in English (optional)").fill("");
  await form.getByLabel("Name in Amharic (optional)").fill("");
  await form.getByRole("button", { name: "Save offer" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved.");
  await page.goto("/en/pricing");
  await expect(card.getByText("Launch offer: 20% off", { exact: true })).toBeVisible();
});
