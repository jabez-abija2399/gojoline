import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on serious or critical WCAG 2.2 AA violations (docs/QUALITY.md). */
export async function expectNoSeriousA11yIssues(page: Page) {
  // Check the settled page, not a frame mid-animation (half-faded text reads as low contrast).
  await page.emulateMedia({ reducedMotion: "reduce" });
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
  const button = page.getByRole("button", { name });
  if (!(await button.isVisible())) return;
  // Retried: a tap before the page is interactive does nothing.
  await expect(async () => {
    if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 500 });
  }).toPass();
}
