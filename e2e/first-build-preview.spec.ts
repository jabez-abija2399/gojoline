import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

// Demo AI and in-memory sandbox (E2E=1). "take your time" holds the first turn for 6 s.

const text = {
  en: { start: "Start a new site", chat: /Your message/, preview: "Preview", building: "Building your site", usually: "Usually about a minute", template: "Bole Buna House", computer: "Computer", saved: "Saved as version 1" },
  am: { start: "አዲስ ድረ-ገጽ ይጀምሩ", chat: /መልዕክትዎ/, preview: "ቅድመ-ዕይታ", building: "ድረ-ገጽዎ እየተሠራ ነው", usually: "ብዙውን ጊዜ አንድ ደቂቃ ገደማ ይወስዳል", template: "ቦሌ ቡና ቤት", computer: "ኮምፒውተር", saved: "እንደ ስሪት 1 ተቀምጧል" },
};

async function newSite(page: Page, lang: "en" | "am") {
  await signIn(page, { lang });
  await page.goto(`/${lang}/build`);
  await page.getByRole("button", { name: text[lang].start }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/build/[0-9a-f-]{36}$`));
}

async function send(page: Page, lang: "en" | "am", message: string) {
  const box = page.getByRole("textbox", { name: text[lang].chat });
  await box.fill(message);
  await box.press("Enter");
}

/** Phones show one view at a time: open the Preview tab. */
async function showPreview(page: Page, lang: "en" | "am", mobile: boolean) {
  if (mobile) await page.getByRole("tab", { name: new RegExp(`^${text[lang].preview}`) }).click();
}

for (const lang of ["en", "am"] as const) {
  test(`a first build shows a building placeholder, never the starter template, then the site (${lang})`, async ({ page }, info) => {
    const mobile = info.project.name === "mobile";
    await newSite(page, lang);
    await send(page, lang, "Selam Coffee take your time");
    await showPreview(page, lang, mobile);
    const panel = page.locator("#panel-preview");
    const placeholder = panel.getByRole("group", { name: text[lang].building });
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText(text[lang].usually);
    // The sandbox is already running the starter template: it is not shown (a frame may load
    // the built site underneath, out of reach, once the build succeeded).
    await expect(panel.locator("iframe:not([inert])")).toHaveCount(0);
    await expect(panel.getByText(text[lang].template)).toHaveCount(0);
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);

    if (!mobile) {
      // The phone/computer switch still works while building.
      await page.getByRole("button", { name: text[lang].computer }).click();
      await expect(page.getByRole("button", { name: text[lang].computer })).toHaveAttribute("aria-pressed", "true");
      await expect(placeholder).toBeVisible();
    }

    // Saved: the real preview takes its place once it has loaded.
    await expect(page.getByText(text[lang].saved).first()).toBeAttached({ timeout: 20_000 });
    await expect(panel.locator(`iframe[title]:not([inert])`)).toBeVisible();
    await expect(placeholder).toHaveCount(0, { timeout: 15_000 });
    await expectNoHorizontalScroll(page);
  });
}

test("a later edit keeps the live preview with the updating chip", async ({ page }, info) => {
  const mobile = info.project.name === "mobile";
  await newSite(page, "en");
  await send(page, "en", "Selam Coffee");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  await send(page, "en", "Abol Cafe take your time");
  await showPreview(page, "en", mobile);
  const panel = page.locator("#panel-preview");
  await expect(panel.getByText("Updating your site...")).toBeVisible();
  await expect(panel.locator("iframe")).toBeVisible();
  await expect(panel.getByRole("group", { name: "Building your site" })).toHaveCount(0);
});

test("a site started from a template plays the build of its own parts once, then shows it, still unnamed", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/en/build#templates");
  await page.locator("form[data-preset=cafe] button").click();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}\?setup=1$/);
  await showPreview(page, "en", info.project.name === "mobile");
  const panel = page.locator("#panel-preview");
  // The template's real sections tick off one by one over an outline of the page.
  const setup = panel.getByRole("group", { name: "Building your site from the template" });
  await expect(setup).toBeVisible();
  await expect(setup.getByRole("listitem").first()).toHaveText("Colours and fonts");
  await expect(setup.getByRole("listitem").nth(1)).toHaveText("Top banner");
  await expectNoSeriousA11yIssues(page);
  // Then the site itself, and the address loses ?setup so a reload shows the site at once.
  await expect(setup).toHaveCount(0, { timeout: 20_000 });
  await expect(panel.locator("iframe")).toBeVisible();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
  // Named "New site" until the owner gives the business's real name (not the template's or its example's).
  await expect(page.getByRole("banner").getByText("New site", { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(panel.getByRole("group", { name: "Building your site from the template" })).toHaveCount(0);
});

test("the template build can be skipped", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/en/build#templates");
  await page.locator("form[data-preset=hotel] button").click();
  await showPreview(page, "en", info.project.name === "mobile");
  const panel = page.locator("#panel-preview");
  await panel.getByRole("button", { name: "Show it now" }).click();
  await expect(panel.getByRole("group", { name: "Building your site from the template" })).toHaveCount(0);
  await expect(panel.locator("iframe")).toBeVisible();
});

test("a first build that fails shows the recovery message, not the template", async ({ page }, info) => {
  const mobile = info.project.name === "mobile";
  await newSite(page, "en");
  await send(page, "en", "break it");
  await expect(page.getByText("I couldn't finish this change").first()).toBeAttached();
  await showPreview(page, "en", mobile);
  const panel = page.locator("#panel-preview");
  await expect(panel.getByRole("paragraph").filter({ hasText: "We couldn't build your site this time" })).toBeVisible();
  await expect(panel.locator("iframe")).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);
  await panel.getByRole("button", { name: "Back to the chat" }).click();
  if (mobile) await expect(page.getByRole("tab", { name: "Chat" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("textbox", { name: /Your message/ })).toBeFocused();
});
