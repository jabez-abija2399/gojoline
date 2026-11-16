import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test.describe("landing page", () => {
  test("redirects / to a language and remembers the choice", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await page.getByRole("link", { name: "አማርኛ" }).click();
    await expect(page).toHaveURL(/\/am$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "am");
    await page.goto("/");
    await expect(page).toHaveURL(/\/am$/);
  });

  test("Amharic visitors get Amharic by default", async ({ browser }) => {
    const context = await browser.newContext({ locale: "am-ET" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/am$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ጎጆዎን");
    await context.close();
  });

  for (const lang of ["en", "am"] as const) {
    test(`${lang}: accessible, no horizontal scroll, security headers`, async ({ page }) => {
      const response = await page.goto(`/${lang}`);
      const headers = response!.headers();
      expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["strict-transport-security"]).toContain("max-age=");
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expectNoHorizontalScroll(page);
      await expectNoSeriousA11yIssues(page);
    });
  }

  test("hero: pick a business; FAQ opens; the menu leads to Templates and Prices; Start free goes to sign-in", async ({ page }) => {
    await page.goto("/en");
    const clinic = page.getByRole("button", { name: "Clinic", exact: true });
    await clinic.click();
    await expect(clinic).toHaveAttribute("aria-pressed", "true");
    // The description is filled in for editing.
    await expect(page.getByRole("textbox", { name: "Describe your business" })).toHaveValue(/A family clinic in Megenagna/);
    // Features: picking one shows its description; the one before closes.
    const birr = page.getByRole("button", { name: "Pay in Birr", exact: true });
    await birr.click();
    await expect(birr).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Start free. Pay by Telebirr or bank transfer, no foreign card needed.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Amharic and English", exact: true })).toHaveAttribute("aria-expanded", "false");
    const question = page.getByText("How do I pay?");
    await question.click();
    await expect(page.getByText(/send the transaction number/i)).toBeVisible();
    // Templates and prices have their own pages, reached from the menu (behind "Menu" on phones).
    const openMenu = async () => {
      if (test.info().project.name === "mobile") await page.getByText("Menu", { exact: true }).click();
    };
    await openMenu();
    await page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).getByRole("link", { name: "Templates" }).click();
    await expect(page).toHaveURL(/\/en\/templates$/);
    await expect(page.getByRole("heading", { level: 1, name: "Start from a real site" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Example sites" }).getByRole("listitem")).toHaveCount(14);
    await expectNoSeriousA11yIssues(page);
    await expectNoHorizontalScroll(page);
    await openMenu();
    await page.getByRole("navigation", { name: "Main" }).filter({ visible: true }).getByRole("link", { name: "Prices" }).click();
    await expect(page).toHaveURL(/\/en\/pricing$/);
    await expect(page.getByRole("heading", { level: 1, name: "Simple prices in Birr" })).toBeVisible();
    await expect(page.getByText("How do I pay?")).toBeVisible();
    await expectNoSeriousA11yIssues(page);
    await expectNoHorizontalScroll(page);
    await page.getByRole("link", { name: "Start free" }).first().click();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test("describe a business on the landing page, sign in, and the site builds itself", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("textbox", { name: "Describe your business" }).fill("Kaldi Books in Piassa");
    await page.getByRole("group", { name: "Site language" }).getByText("Both").click();
    await page.getByRole("button", { name: "Build my site" }).click();
    await expect(page).toHaveURL(/\/en\/sign-in\?next=/);
    let sent: unknown = null;
    page.on("request", (r) => {
      if (r.url().endsWith("/messages") && r.method() === "POST") sent = r.postDataJSON();
    });
    const contact = `landing-${Date.now()}-${test.info().project.name}@example.com`;
    await page.getByLabel("Phone or email").fill(contact);
    await page.getByRole("button", { name: "Send me a code" }).click();
    const code = page.getByLabel("6-digit code");
    await expect(code).toBeVisible();
    const res = await page.request.get(`/api/test/otp?to=${encodeURIComponent(contact)}`);
    await code.fill(((await res.json()) as { code: string }).code);
    await page.getByRole("button", { name: "Continue" }).click();
    // No more clicks: the new site opens and builds from the description.
    await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Saved as version 1").first()).toBeVisible();
    expect(sent).toMatchObject({ text: "Kaldi Books in Piassa", languages: ["en", "am"] });
  });

  test("Start from this: the picked real site opens after sign-in; typed words are never replaced", async ({ page }) => {
    await page.goto("/en");
    // The showcase opens on the café; picking another never overwrites what the visitor wrote.
    await expect(page.getByRole("button", { name: "Café", exact: true })).toHaveAttribute("aria-pressed", "true");
    const box = page.getByRole("textbox", { name: "Describe your business" });
    await box.fill("My own words");
    await page.getByRole("button", { name: "Hotel", exact: true }).click();
    await expect(box).toHaveValue("My own words");
    await expect(page.getByRole("button", { name: "Hotel", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("img", { name: /builder with the site it made for Tana Shore Lodge/ })).toBeVisible();

    await page.getByRole("link", { name: "See all 14 templates" }).click();
    await expect(page).toHaveURL(/\/en\/templates$/);
    await page.getByRole("list", { name: "Example sites" }).getByRole("link", { name: /Clinic/ }).click();
    await expect(page).toHaveURL(/\/en\/sign-in\?next=/);
    const contact = `preset-${Date.now()}-${test.info().project.name}@example.com`;
    await page.getByLabel("Phone or email").fill(contact);
    await page.getByRole("button", { name: "Send me a code" }).click();
    const code = page.getByLabel("6-digit code");
    await expect(code).toBeVisible();
    const res = await page.request.get(`/api/test/otp?to=${encodeURIComponent(contact)}`);
    await code.fill(((await res.json()) as { code: string }).code);
    await page.getByRole("button", { name: "Continue" }).click();
    // The clinic template opens as the new account's first site.
    await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Your Clinic site is ready").first()).toBeAttached();
  });

  test("waitlist: shows errors, then success", async ({ page }) => {
    await page.goto("/en/waitlist");
    const form = page.locator("#waitlist");
    await form.getByLabel("Your name").fill("Abebe");
    await form.getByLabel("Phone or email").fill("12345");
    await form.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(form.getByText("Please enter a valid Ethiopian phone number")).toBeVisible();
    await expect(form.getByLabel("Your name")).toHaveValue("Abebe");
    await expectNoSeriousA11yIssues(page);

    await form.getByLabel("Phone or email").fill("0911 234 567");
    await form.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(form.getByRole("status")).toContainText("You're on the list");
  });

  test("waitlist works in Amharic", async ({ page }) => {
    await page.goto("/am/waitlist");
    const form = page.locator("#waitlist");
    await form.getByLabel("ስምዎ").fill("ሰላም");
    await form.getByLabel("ስልክ ወይም ኢሜይል").fill("selam@example.com");
    await form.getByRole("button", { name: "የመጠባበቂያ ዝርዝሩን ይቀላቀሉ" }).click();
    await expect(form.getByRole("status")).toContainText("ተመዝግበዋል");
  });

  test("serves icons, manifest and social image", async ({ request }) => {
    for (const path of ["/favicon.ico", "/icon.svg", "/apple-icon.png", "/manifest.webmanifest", "/brand/og-image.png", "/robots.txt", "/sitemap.xml"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});

test("waitlist moves focus to the first problem, then to the success message", async ({ page }) => {
  await page.goto("/en/waitlist");
  const form = page.locator("#waitlist");
  await form.getByLabel("Your name").fill("Abebe");
  await form.getByLabel("Phone or email").fill("nope");
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(form.getByLabel("Phone or email")).toBeFocused();
  await form.getByLabel("Phone or email").fill("abebe@example.com");
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(form.getByRole("status")).toBeFocused();
});

test("signed in: every way in leads to Your sites, never to the sign-in page", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/en");
  const header = page.getByRole("banner");
  if (info.project.name === "mobile") await header.locator("summary").click();
  const toSites = header.getByRole("link", { name: "Your sites" }).filter({ visible: true });
  // One way in, not two links to the same page.
  await expect(toSites).toHaveCount(1);
  await expect(toSites).toHaveAttribute("href", "/en/build");
  await expect(header.getByRole("link", { name: "Sign in" }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open your sites" })).toHaveAttribute("href", "/en/build");
  await expect(page.locator('a[href*="/sign-in"]')).toHaveCount(0);

  // The description typed on the landing page goes straight to "Your sites": a new account
  // (no sites yet) starts building it at once, with no sign-in page in between.
  await page.locator("#hero-prompt").fill("Kaldi Books in Piassa");
  await page.locator("#hero-prompt").press("Control+Enter");
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("log", { name: "Chat" }).getByText("Kaldi Books in Piassa")).toBeVisible();

  await page.goto("/en/pricing");
  await expect(page.locator('a[href*="/sign-in"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "See plans and payments" }).first()).toHaveAttribute("href", "/en/billing");
  await page.goto("/en/templates");
  await expect(page.locator('a[href*="/sign-in"]')).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);
});

test("signed out: the landing page offers sign-in and a free start", async ({ page }) => {
  await page.goto("/en/pricing");
  await expect(page.getByRole("link", { name: "Start free" }).first()).toHaveAttribute("href", /\/en\/sign-in/);
});

test("landing motion: the demo plays itself and can be paused; reduced motion keeps it still", async ({ page, browser }) => {
  // It waits for the demo to move on by itself, twice.
  test.setTimeout(75_000);
  await page.goto("/en");
  const chips = page.getByRole("group", { name: "Gojoline for" });
  await chips.scrollIntoViewIfNeeded();
  await expect(chips.getByRole("button", { name: "Café" })).toHaveAttribute("aria-pressed", "true");
  // Pausing straight away keeps the control (and focus) so it can be played again.
  const toggle = page.getByRole("button", { name: "Pause the demo" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle).toBeFocused();
  await toggle.click();
  // After a few seconds the next business is shown by itself...
  await expect(chips.getByRole("button", { name: "Hotel" })).toHaveAttribute("aria-pressed", "true", { timeout: 9000 });
  // ...until the visitor pauses it.
  await page.getByRole("button", { name: "Pause the demo" }).click();
  await page.waitForTimeout(7000);
  await expect(chips.getByRole("button", { name: "Hotel" })).toHaveAttribute("aria-pressed", "true");

  // The moving list of businesses can be paused on any device.
  const listToggle = page.getByRole("button", { name: "Pause the moving list" });
  await listToggle.click();
  await expect(listToggle).toHaveAttribute("aria-pressed", "true");

  // Before and after: a slider anyone can move with the keyboard.
  const slider = page.getByRole("slider", { name: "Slide to compare your message and your website" });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  const still = await browser.newContext({ reducedMotion: "reduce" });
  const calm = await still.newPage();
  await calm.goto("/en");
  await calm.waitForTimeout(7000);
  await expect(calm.getByRole("group", { name: "Gojoline for" }).getByRole("button", { name: "Café" })).toHaveAttribute("aria-pressed", "true");
  await still.close();
});
