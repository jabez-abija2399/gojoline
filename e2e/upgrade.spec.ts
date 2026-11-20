import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

// Runs against the deterministic demo AI (E2E=1). /api/test/credits sets the changes left.
const chat = (page: Page) => page.getByRole("textbox", { name: /Your message|መልዕክትዎ/ });
async function say(page: Page, text: string) {
  await chat(page).fill(text);
  await chat(page).press("Enter");
}

/** A signed-in owner with one built site and no changes left (on a plan, if given). */
async function ownerAtZero(page: Page, lang: "en" | "am" = "en", plan?: "starter" | "business") {
  await signIn(page, { lang });
  await page.goto(`/${lang}/build`);
  await page.getByRole("button", { name: lang === "en" ? "Start a new site" : "አዲስ ድረ-ገጽ ይጀምሩ" }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/build/[0-9a-f-]{36}$`));
  await say(page, "Selam Coffee");
  await expect(page.getByRole("log").getByText(/Free first build|ነጻ የመጀመሪያ ግንባታ/)).toBeVisible();
  const res = await page.request.post("/api/test/credits", { data: { left: 0, ...(plan ? { plan } : {}) } });
  expect(await res.json()).toEqual({ credits: 0 });
  await page.reload();
}

test("a Free owner at 0 changes sees the upgrade dialog on sending, and Upgrade goes to the payment form", async ({ page }) => {
  await ownerAtZero(page);
  // Opening the page at 0 doesn't nag.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await say(page, "Make the title bigger");
  const dialog = page.getByRole("dialog", { name: "You've used all your AI changes" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/Your 10 free changes come back on 1 \w+\./);
  const choices = dialog.getByRole("list", { name: "What would help" });
  await expect(choices.getByRole("listitem")).toHaveCount(2);
  await expect(choices.getByRole("listitem").nth(0)).toContainText("Starter");
  await expect(choices.getByRole("listitem").nth(0)).toContainText(/\d+ AI changes a month/);
  await expect(choices.getByRole("listitem").nth(1)).toContainText("Business");
  await expect(choices.getByRole("listitem").nth(1)).toContainText(/\d+ AI changes a month/);
  // One coral action, focused on open, and a way out.
  await expect(dialog.getByRole("link", { name: "Upgrade to Starter" })).toBeFocused();
  await expect(choices.getByRole("listitem").nth(0)).toContainText("Best for you");
  await expect(dialog.getByRole("button", { name: "Maybe later" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  // Escape closes it; the message stays unsent in the box, which has focus again.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(chat(page)).toHaveValue("Make the title bigger");
  await expect(chat(page)).toBeFocused();

  await chat(page).press("Enter");
  await dialog.getByRole("link", { name: "Upgrade to Starter" }).click();
  await expect(page).toHaveURL(/\/en\/billing\?product=starter_month#pay-title$/);
  await expect(page.locator("input[name=product]")).toHaveValue("starter_month");
});

test("a Starter owner at 0 is offered 30 more changes first, then Business", async ({ page }) => {
  await ownerAtZero(page, "en", "starter");
  await say(page, "Make the title bigger");
  const dialog = page.getByRole("dialog", { name: "You've used all your AI changes" });
  await expect(dialog).toContainText(/Your 50 monthly changes come back on/);
  const items = dialog.getByRole("list", { name: "What would help" }).getByRole("listitem");
  await expect(items.nth(0)).toContainText("Extra changes");
  await expect(items.nth(0)).toContainText("30 more AI changes");
  await expect(items.nth(1)).toContainText("Business");
  await expect(dialog.getByRole("link", { name: "Choose Business" })).toHaveAttribute("href", "/en/billing?product=business_month#pay-title");
  await dialog.getByRole("button", { name: "Maybe later" }).click();
  await expect(dialog).toBeHidden();
  await chat(page).press("Enter");
  await dialog.getByRole("link", { name: "Buy 30 more changes" }).click();
  await expect(page).toHaveURL(/product=topup#pay-title$/);
  await expect(page.locator("input[name=product]")).toHaveValue("topup");
});

test("Amharic upgrade dialog at 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await ownerAtZero(page, "am");
  await say(page, "ርዕሱን ትልቅ አድርግ");
  const dialog = page.getByRole("dialog", { name: "የኤአይ ለውጦችዎን ሁሉ ተጠቅመዋል" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "ወደ ስታርተር ያሳድጉ" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
  // The sheet fits the phone: nothing sticks out sideways.
  const box = await dialog.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(360);
});
