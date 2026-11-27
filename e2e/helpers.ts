import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on serious or critical WCAG 2.2 AA violations (docs/QUALITY.md). */
export async function expectNoSeriousA11yIssues(page: Page) {
  // Check the settled page, not a frame mid-animation (half-faded text reads as low contrast).
  await page.emulateMedia({ reducedMotion: "reduce" });
  // Sections not yet scrolled to (`content-visibility: auto`) can report stale colours (seen in
  // dark mode): render them all so axe reads what visitors will see.
  await page.addStyleTag({ content: ".below-fold { content-visibility: visible !important; }" });
  // Scroll-driven animations (the landing "reveal") and transitions inside offscreen
  // `content-visibility: auto` sections never finish until scrolled to, so wait at most 3 s.
  await page.evaluate(() =>
    Promise.race([
      Promise.all(document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline).map((a) => a.finished.catch(() => undefined))),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]),
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`),
  ).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

let counter = 0;

/** Signs in with a fresh email (or the given contact) using the e2e-only code lookup. */
export async function signIn(page: Page, opts: { lang?: "en" | "am"; contact?: string; normalized?: string } = {}) {
  const lang = opts.lang ?? "en";
  const contact = opts.contact ?? `owner-${Date.now()}-${process.pid}-${++counter}@example.com`;
  const to = opts.normalized ?? contact.toLowerCase();
  await page.goto(`/${lang}/sign-in`);
  await page.getByLabel(lang === "en" ? "Phone or email" : "ስልክ ወይም ኢሜይል").fill(contact);
  await page.getByRole("button", { name: lang === "en" ? "Send me a code" : "ኮድ ይላኩልኝ" }).click();
  const codeField = page.getByLabel(lang === "en" ? "6-digit code" : "ባለ 6 አሃዝ ኮድ");
  await expect(codeField).toBeVisible();
  const res = await page.request.get(`/api/test/otp?to=${encodeURIComponent(to)}`);
  const { code } = (await res.json()) as { code: string };
  await codeField.fill(code);
  await page.getByRole("button", { name: lang === "en" ? "Continue" : "ይቀጥሉ" }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/build$`));
  return contact;
}

/** Phones keep the signed-in navigation behind "Menu"; large screens show it beside the page. */
export async function openAppMenu(page: Page, lang: "en" | "am" = "en") {
  const menu = page.getByRole("button", { name: lang === "en" ? "Menu" : "ማውጫ", exact: true });
  const account = page.getByRole("button", { name: lang === "en" ? /Account menu/ : /የመለያ ማውጫ/ });
  // Wait until the page shows one of them: checking at once raced the first render on slow runs.
  await expect(menu.or(account).first()).toBeVisible();
  if (await menu.isVisible()) await menu.click();
}

/** Sign out, plan and language live in the account menu at the bottom of the sidebar. */
export async function openAccountMenu(page: Page, lang: "en" | "am" = "en") {
  await openAppMenu(page, lang);
  await page.getByRole("button", { name: lang === "en" ? /Account menu/ : /የመለያ ማውጫ/ }).click();
}

/** Opens a section folded away on phones (its heading is a button there); does nothing on large screens. */
export async function unfold(page: Page, name: RegExp) {
  // includeHidden: on large screens the toggle is in the page but hidden (lg:hidden).
  const button = page.getByRole("button", { name, includeHidden: true });
  // Wait for the page to draw the toggle first: checking at once can run before it exists and
  // skip unfolding on phones.
  await button.waitFor({ state: "attached" });
  // Decide by screen width (lg = 1024 px), not by visibility: while the page still streams in, the
  // toggle is in the page but not shown yet, and checking then skipped unfolding on phones.
  if ((page.viewportSize()?.width ?? 1280) >= 1024) return;
  await expect(button).toBeVisible();
  // Wait for the page's code before tapping: React replays taps made during hydration, so quick
  // retries could replay two taps and fold it again. Retried slowly, and only kept once it stays open.
  await page.waitForLoadState("load");
  // React marks an element once it has hydrated it; tapping before that is replayed later and
  // can fold the section again after the check below.
  await expect.poll(() => button.evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactProps")))).toBe(true);
  await expect(async () => {
    if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 2000 });
    await page.waitForTimeout(300);
    await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 100 });
  }).toPass();
}

const PAY_NAMES = { starter_month: "Starter, 1 month", starter_year: "Starter, 1 year", business_month: "Business, 1 month", business_year: "Business, 1 year" } as const;

/** Chooses what to pay for on the Plan page, the way an owner does: on the plan cards (English). */
export async function payFor(page: Page, product: keyof typeof PAY_NAMES | "topup") {
  if (product === "topup") {
    await billingTab(page, "Your plan");
    await page.getByRole("link", { name: /^Buy \d+ changes$/ }).click();
    await expect(page.locator("#pay-product")).toHaveText(/extra changes/);
    return;
  }
  await billingTab(page, "Your plan");
  const [plan, period] = product.split("_");
  await page.getByRole("button", { name: period === "month" ? /^Monthly/ : /^Yearly/ }).click();
  await page.getByRole("link", { name: new RegExp(`^(Choose|Renew) ${plan === "starter" ? "Starter" : "Business"}$`) }).click();
  await expect(page.locator("#pay-product")).toHaveText(PAY_NAMES[product]);
}

/** Opens a tab on the Plan page ("Your plan", "Pay", "History", "Invite"). */
export async function billingTab(page: Page, name: string) {
  const tab = page.getByRole("tab", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
}
