import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, openAppMenu, payFor, signIn, unfold } from "./helpers";

test("an owner sends a payment and an admin approves it", async ({ page, browser }) => {
  await signIn(page);
  // The changes left are in sight from the first screen.
  await openAppMenu(page);
  await expect(page.getByRole("link", { name: /10 changes left.*Free plan.*Upgrade/ })).toBeVisible();
  await page.getByRole("link", { name: "Plan and payments", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Plan and payments", level: 1 })).toBeVisible();
  await expect(page.getByText("Your plan: Free")).toBeVisible();
  await expect(page.locator('li[aria-current="true"]')).toContainText("Your plan");
  // Payment in three steps; Telebirr and CBE come from the admin's settings.
  for (const n of [1, 2, 3]) await expect(page.getByRole("heading", { name: new RegExp(`^Step ${n}:`) })).toBeVisible();
  await expect(page.getByText("Telebirr number").first()).toBeVisible();
  await expect(page.getByText("0911000000", { exact: true })).toBeVisible();
  await expect(page.getByText("Account holder name")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);

  await payFor(page, "starter_month");
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("transaction number");
  await expect(page.getByLabel("Transaction number")).toBeFocused();

  const reference = `E2E${Date.now().toString(36).toUpperCase()}${test.info().project.name.length}`;
  await page.getByLabel("Transaction number").fill(reference);
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("add a photo");
  await page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByText("photo.jpg selected")).toBeVisible();
  await page.getByRole("button", { name: "Send for checking" }).click();
  const status = page.getByRole("status").filter({ hasText: "Thank you" });
  await expect(status).toBeFocused();
  await expect(status.getByRole("list", { name: "Payment progress" })).toContainText("Checking");
  await expect(status.getByRole("link", { name: "Questions? Message us on Telegram" })).toHaveAttribute("href", "https://t.me/gojoline_bot");
  await expectNoSeriousA11yIssues(page);

  // The same transaction number cannot be used twice, even typed differently.
  await page.getByRole("button", { name: "Send another payment" }).click();
  await payFor(page, "starter_month");
  await page.getByLabel("Transaction number").fill(reference.toLowerCase().replace("E2E", "e2e-"));
  await page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await page.getByRole("button", { name: "Send for checking" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("already sent");

  // Ordinary owners can't see the admin page.
  expect((await page.goto("/en/admin"))?.status()).toBe(404);

  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  const admin = await ctx.newPage();
  await signIn(admin, { contact: `admin-e2e-pay-${test.info().project.name}@example.com` });
  await admin.goto("/en/admin?tab=payments");
  const item = admin.getByRole("listitem").filter({ hasText: reference });
  await expect(item).toBeVisible();
  await expectNoSeriousA11yIssues(admin);
  await item.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByRole("listitem").filter({ hasText: reference })).toHaveCount(0);
  await ctx.close();

  await page.goto("/en/billing");
  await expect(page.getByText("Your plan: Starter")).toBeVisible();
  // Phones fold the payment list away.
  await unfold(page, /Your payments/);
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
});

test("payment steps: plan cards choose the product, Telebirr or CBE, copy buttons, a code behind 'Have a code?'", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await signIn(page);
  await page.goto("/en/billing");
  // Monthly or yearly, and one action per plan card.
  const plans = page.getByRole("group", { name: "How often you pay" });
  await expect(plans.getByRole("button", { name: /Monthly/ })).toHaveAttribute("aria-pressed", "true");
  await plans.getByRole("button", { name: /Yearly/ }).click();
  const business = page.locator("li").filter({ has: page.getByRole("heading", { name: "Business", level: 3 }) });
  await expect(business).toContainText("a year");
  await expect(business).toContainText(/You save [\d,.]+ Birr a year/);
  await business.getByRole("link", { name: "Choose Business" }).click();
  await expect(page.locator("input[name=product]")).toHaveValue("business_year");
  await expect(page).toHaveURL(/product=business_year/);
  await page.getByRole("link", { name: "Buy 30 changes" }).click();
  await expect(page.locator("input[name=product]")).toHaveValue("topup");

  // The exact amount and the account number, ready to paste into Telebirr or the bank app.
  await page.getByRole("button", { name: "Copy Telebirr number" }).click();
  await expect(page.getByRole("button", { name: "Copied Telebirr number" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("0911000000");
  await page.getByRole("button", { name: "Copy Amount to send" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^\d+(\.\d+)?$/);
  await page.getByText("Bank transfer (CBE)").click();
  await expect(page.getByText("Account number", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("1000123456789")).toBeVisible();

  // The code field is folded away until asked for.
  await expect(page.getByLabel("Discount code (optional)")).toBeHidden();
  await page.getByRole("button", { name: "Have a code?" }).click();
  await expect(page.getByLabel("Discount code (optional)")).toBeFocused();
  // A receipt photo shows a preview.
  await page.getByLabel("Photo of the receipt or SMS").setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByRole("img", { name: "Your receipt photo" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("Amharic Plan page at phone width, and dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await signIn(page, { lang: "am" });
  await page.goto("/am/billing");
  await expect(page.getByRole("heading", { name: /ደረጃ 1/ })).toBeVisible();
  await expect(page.getByText("የቴሌብር ቁጥር").first()).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await expectNoSeriousA11yIssues(page);
});

test("an admin changes a price and the Plan page shows it", async ({ page }) => {
  await signIn(page, { contact: `admin-e2e-set-${test.info().project.name}@example.com` });
  await page.goto("/en/admin?tab=settings");
  await expect(page.getByRole("heading", { name: "Prices and payment accounts" })).toBeVisible();
  // Prices are grouped by plan, yearly fields show the saving, and the plan table customers see is below.
  await expect(page.getByRole("group", { name: "Starter" }).getByText(/Saves [\d,]+ Birr a year/)).toBeVisible();
  await expect(page.getByRole("table", { name: "What each plan includes" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  const price = page.getByLabel("Business, 1 year (Birr)");
  await price.fill("abc");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "check the highlighted field" })).toBeVisible();
  const value = test.info().project.name === "mobile" ? "9500" : "9600.50";
  await price.fill(value);
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  await page.goto("/en/billing");
  await page.getByRole("group", { name: "How often you pay" }).getByRole("button", { name: /Yearly/ }).click();
  await expect(page.locator("li").filter({ has: page.getByRole("heading", { name: "Business", level: 3 }) })).toContainText(/(9,500|9,600\.5) Birr/);
});

test("admin dashboard: overview, owners, and dark mode", async ({ page }) => {
  await signIn(page, { contact: `admin-e2e-dash-${test.info().project.name}@example.com` });
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(page.getByText("Needs your attention")).toBeVisible();
  await expect(page.getByRole("img", { name: /New owners, 30 days/ })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("button", { name: "Dark" }).first().click();
  await expect(page.locator(".admin-root")).toHaveAttribute("data-gojo-theme", "dark");
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("link", { name: "Owners" }).first().click();
  await expect(page.getByRole("searchbox").or(page.getByPlaceholder("Search by name, email or phone"))).toBeVisible();
  await page.getByRole("button", { name: "Light" }).first().click();
  await expect(page.locator(".admin-root")).toHaveAttribute("data-gojo-theme", "light");
});

test("admin owners: filter by plan, open an owner, give extra changes and set a plan", async ({ page, browser }) => {
  const { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL } = test.info().project.use;
  const ctx = await browser.newContext({ viewport, userAgent, isMobile, hasTouch, deviceScaleFactor, baseURL });
  const owner = await signIn(await ctx.newPage());
  await ctx.close();

  await signIn(page, { contact: `admin-e2e-own-${test.info().project.name}@example.com` });
  await page.goto(`/en/admin?tab=users&q=${encodeURIComponent(owner)}`);
  const filter = page.getByRole("navigation", { name: "Filter by plan" });
  await expect(filter.getByRole("link", { name: /^All \d+$/ })).toHaveAttribute("aria-current", "true");
  await page.getByRole("table").getByRole("link", { name: /Details$/ }).first().click();
  const details = page.getByRole("region", { name: /^Owner details/ });
  await expect(details).toBeVisible();
  await expect(details.getByText("Changes left").locator("..")).toContainText("10");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  const give = page.locator("form").filter({ has: page.getByRole("heading", { name: "Give extra changes" }) });
  await give.getByLabel("How many (1 to 500)").fill("5");
  await give.getByLabel("Reason (saved in the log)").fill("Sorry for the wait");
  await give.getByRole("button", { name: "Give changes" }).click();
  await expect(give.getByRole("status")).toHaveText("Changes added.");
  await expect(details.getByText("Changes left").locator("..")).toContainText("15");

  const plan = page.locator("form").filter({ has: page.getByRole("heading", { name: "Set plan" }) });
  await plan.getByLabel("New plan").selectOption("business_month");
  await plan.getByLabel("Reason (saved in the log)").fill("Launch partner");
  await plan.getByRole("button", { name: "Set plan" }).click();
  await expect(plan.getByRole("status")).toHaveText("Plan updated.");
  await expect(details.getByText("Plan", { exact: true }).locator("..")).toContainText("Business");

  await filter.getByRole("link", { name: /^Business \d+$/ }).click();
  await expect(page).toHaveURL(/plan=business/);
  await expect(page.getByRole("table").getByRole("link", { name: /Details$/ })).toHaveCount(1);
});


test("admin owners in Amharic: accessible, the panel isn't under the header, and a second owner gets focus", async ({ page }) => {
  await signIn(page, { contact: `admin-e2e-am-${test.info().project.name}@example.com` });
  // At least two owners in the list: the admin and one more.
  await page.goto("/am/admin?tab=users");
  const rows = page.getByRole("table").getByRole("link", { name: /ዝርዝር$/ });
  await expect(rows.nth(1)).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  // Other tests add owners while this runs, so rows can shift: open them by their address.
  const [a, b] = [await rows.nth(0).getAttribute("href"), await rows.nth(1).getAttribute("href")];
  await page.locator(`a[href="${a}"]`).click();
  const panel = page.getByRole("region", { name: /^የባለቤቱ ዝርዝር/ });
  await expect(panel).toBeVisible();
  const first = await panel.getByRole("heading", { level: 3 }).textContent();
  // Focus moved to the panel, and its top is below the sticky header.
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.querySelector("[aria-labelledby='owner-kicker owner-title']"))).toBe(true);
  const headerBottom = await page.locator("header").first().evaluate((h) => h.getBoundingClientRect().bottom);
  expect(await panel.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await page.locator(`table a[href="${b}"]`).click();
  await expect(panel.getByRole("heading", { level: 3 })).not.toHaveText(first ?? "");
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.querySelector("[aria-labelledby='owner-kicker owner-title']"))).toBe(true);
  expect(await panel.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
});

test("a pricing Choose button keeps the yearly choice through sign-in to the Plan page", async ({ page }) => {
  await page.goto("/en/pricing?billing=yearly");
  await page.getByRole("link", { name: "Choose Business" }).click();
  await expect(page).toHaveURL(/sign-in\?next=/);
  const contact = `owner-choose-${Date.now()}-${test.info().project.name}@example.com`;
  await page.getByLabel("Phone or email").fill(contact);
  await page.getByRole("button", { name: "Send me a code" }).click();
  await expect(page.getByLabel("6-digit code")).toBeVisible();
  const code = (await (await page.request.get(`/api/test/otp?to=${encodeURIComponent(contact)}`)).json()) as { code: string };
  await page.getByLabel("6-digit code").fill(code.code);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/en\/billing\?product=business_year$/);
  await expect(page.locator("input[name=product]")).toHaveValue("business_year");
  // Signed in already: the same button goes straight to the Plan page.
  await page.goto("/en/pricing");
  await page.getByRole("link", { name: "Choose Starter" }).click();
  await expect(page).toHaveURL(/\/en\/billing\?product=starter_month$/);
  await expect(page.locator("input[name=product]")).toHaveValue("starter_month");
});
