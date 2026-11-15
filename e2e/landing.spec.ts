import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues } from "./helpers";

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

  test("hero demo switches business; FAQ opens; Start free goes to sign-in", async ({ page }) => {
    await page.goto("/en");
    const clinic = page.getByRole("button", { name: "Clinic", exact: true });
    await clinic.click();
    await expect(clinic).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Megenagna Family Clinic")).toBeVisible();
    await expect(page.getByText("A family clinic in Megenagna")).toBeVisible();
    const question = page.getByText("How do I pay?");
    await question.click();
    await expect(page.getByText(/send the transaction number/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Simple prices in Birr" })).toBeVisible();
    await page.getByRole("link", { name: "Start free" }).first().click();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test("waitlist: shows errors, then success", async ({ page }) => {
    await page.goto("/en");
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
    await page.goto("/am");
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
  await page.goto("/en");
  const form = page.locator("#waitlist");
  await form.getByLabel("Your name").fill("Abebe");
  await form.getByLabel("Phone or email").fill("nope");
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(form.getByLabel("Phone or email")).toBeFocused();
  await form.getByLabel("Phone or email").fill("abebe@example.com");
  await form.getByRole("button", { name: "Join the waitlist" }).click();
  await expect(form.getByRole("status")).toBeFocused();
});
