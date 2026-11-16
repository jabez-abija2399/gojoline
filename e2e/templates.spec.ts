import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("start from an industry template in Amharic: a ready site, no AI needed", async ({ page }) => {
  await signIn(page, { lang: "am" });
  // With no sites yet, the templates are what the page shows under the start box.
  await expect(page.getByRole("tab", { name: "አብነቶች" })).toHaveAttribute("aria-selected", "true");
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("button", { name: "ይጠቀሙ: ሆቴል ወይም የእንግዳ ማረፊያ" }).click();
  await expect(page).toHaveURL(/\/am\/build\/[0-9a-f-]{36}$/);
  // The chat says it's a ready example to personalise; publishing waits for real details.
  await expect(page.getByText("ድረ-ገጽዎ ዝግጁ ነው").first()).toBeAttached();
  await page.getByRole("button", { name: "ያትሙ", exact: true }).click();
  const address = page.getByLabel("የድረ-ገጽዎ አድራሻ");
  await expect(address).toHaveValue(/\w/);
  await address.fill(`tana-${test.info().project.name}-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "አሁን ያትሙ" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("የምሳሌ መረጃዎች");
  await page.keyboard.press("Escape");
  await page.goto("/am/build");
  // Named after the kind of business, not the example's made-up name.
  await expect(page.getByRole("main").getByRole("link", { name: "ሆቴል ወይም የእንግዳ ማረፊያ", exact: true })).toBeVisible();
});

test("a template's preview shows every page and section before it is picked", async ({ page }) => {
  await page.goto("/en/templates/hotel");
  await expect(page.getByRole("heading", { level: 1, name: "Hotel or guest house" })).toBeVisible();
  await expect(page.getByText("Example: Tana Shore Lodge")).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  // Each section is named: what it is and its own title.
  await expect(page.getByRole("button", { name: /Rooms and suites/ })).toBeVisible();
  // Other pages of the template, and the phone layout.
  await page.getByRole("button", { name: "Dining" }).click();
  await expect(page.getByRole("button", { name: "Dining" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Fresh from the lake, cooked at home/ })).toBeVisible();
  await page.getByRole("button", { name: "Phone" }).click();
  await expect(page.getByRole("button", { name: "Phone" })).toHaveAttribute("aria-pressed", "true");
  await expectNoHorizontalScroll(page);

  // Signed in, "Use this template" opens it as a new site straight away.
  await signIn(page);
  await page.goto("/en/templates/hotel");
  await page.getByRole("button", { name: "Use this template" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}$/);
  await expect(page.getByText("Your Hotel or guest house site is ready").first()).toBeAttached();
});

test("the templates page: search and filters narrow the list, and a card opens the full preview", async ({ page }) => {
  await page.goto("/en/templates");
  const list = page.getByRole("list", { name: "Example sites" });
  await expect(list.getByRole("listitem")).toHaveCount(14);
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("searchbox", { name: "Search templates" }).fill("prayer");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByText("1 result")).toBeVisible();
  await page.getByRole("searchbox", { name: "Search templates" }).fill("");
  // Categories are plain links, always in view.
  await page.getByRole("navigation", { name: "Category" }).getByRole("link", { name: "Health and beauty" }).click();
  await expect(page).toHaveURL(/\/en\/templates\?category=health$/);
  await expect(list.getByRole("listitem")).toHaveCount(2);
  // Back and Forward follow the address.
  await page.goBack();
  await expect(list.getByRole("listitem")).toHaveCount(14);
  await page.goForward();
  await expect(page.getByRole("navigation", { name: "Category" }).getByRole("link", { name: "Health and beauty" })).toHaveAttribute("aria-current", "page");
  await expect(list.getByRole("listitem")).toHaveCount(2);
  // Other filters sit behind a button on phones.
  const filters = page.getByRole("button", { name: "Filters", exact: true });
  if (await filters.isVisible()) await filters.click();
  await page.getByRole("checkbox", { name: "Team or staff" }).check();
  await expect(page.getByRole("heading", { name: /Health and beauty/ })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(page).toHaveURL(/\/en\/templates$/);
  await expect(list.getByRole("listitem")).toHaveCount(14);
  await list.getByRole("link", { name: /Salon or barber/ }).click();
  await expect(page).toHaveURL(/\/en\/templates\/salon$/);
});

test.describe("templates without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("category chips are links that filter on the server", async ({ page }) => {
    await page.goto("/en/templates?category=faith");
    const chips = page.getByRole("navigation", { name: "Category" });
    await expect(chips.getByRole("link", { name: "Faith and community" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 2, name: /Faith and community/ })).toBeVisible();
    const list = page.getByRole("list", { name: "Example sites" });
    await expect(list.getByRole("listitem")).toHaveCount(3);
    // Each card says its category.
    await expect(list.getByRole("link", { name: /Mosque/ })).toContainText("Faith and community");
    // An unknown category shows everything.
    await page.goto("/en/templates?category=nope");
    await expect(page.getByRole("list", { name: "Example sites" }).getByRole("listitem")).toHaveCount(14);
  });
});

test("the gallery in Amharic: category chips, accessible, no sideways scroll", async ({ page }) => {
  await page.goto("/am/templates?category=food");
  const chips = page.getByRole("navigation", { name: "ምድብ" });
  await expect(chips.getByRole("link", { name: "ምግብና መጠጥ" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("list", { name: "የምሳሌ ድረ-ገጾች" }).getByRole("listitem")).toHaveCount(1);
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
});

const CAFE = {
  en: { crumbs: "Where you are", templates: "Templates", category: "Food and drink", current: "Café or restaurant", name: "Bole Buna House", example: "Example: Bole Buna House", who: "Juice bars", whoTitle: "Designed for", chips: "What's included", chip: "Menu with prices", chip2: "English and Amharic", use: "Use this template", address: "Example address", phone: "Phone", computer: "Computer" },
  am: { crumbs: "ያሉበት ቦታ", templates: "አብነቶች", category: "ምግብና መጠጥ", current: "ካፌ ወይም ምግብ ቤት", name: "ቦሌ ቡና ቤት", example: "ምሳሌ፦ ቦሌ ቡና ቤት", who: "ጭማቂ ቤቶች", whoTitle: "የሚስማማቸው", chips: "ምን ምን አለው", chip: "ምናሌ ከዋጋ ጋር", chip2: "እንግሊዝኛና አማርኛ", use: "ይህን አብነት ይጠቀሙ", address: "የምሳሌ አድራሻ", phone: "ስልክ", computer: "ኮምፒውተር" },
};

for (const lang of ["en", "am"] as const) {
  test(`the café template in ${lang}: breadcrumb, who it suits, highlights, framed preview, one button`, async ({ page }) => {
    const copy = CAFE[lang];
    await page.goto(`/${lang}/templates/cafe`);
    // The heading is the kind of business, the same words as the breadcrumb; the sample's name is a line under it.
    await expect(page.getByRole("heading", { level: 1, name: copy.current })).toBeVisible();
    await expect(page.getByText(copy.example)).toBeVisible();
    // Search engines get the description in the page's language.
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain(lang === "en" ? ". Designed for: " : "። የሚስማማቸው፦ ");

    // Breadcrumb: Templates › Category › Template.
    const crumbs = page.getByRole("navigation", { name: copy.crumbs });
    await expect(crumbs.getByRole("listitem")).toHaveCount(3);
    await expect(crumbs.getByRole("link", { name: copy.templates })).toHaveAttribute("href", `/${lang}/templates`);
    await expect(crumbs.getByRole("link", { name: copy.category })).toHaveAttribute("href", `/${lang}/templates?category=food`);
    await expect(crumbs.locator("[aria-current=page]")).toHaveText(copy.current);

    // Who it suits and what it has, from the template's data.
    await expect(page.getByRole("region", { name: copy.whoTitle }).getByRole("listitem").filter({ hasText: copy.who })).toBeVisible();
    const chips = page.getByRole("region", { name: copy.chips }).getByRole("listitem");
    await expect(chips.filter({ hasText: copy.chip })).toBeVisible();
    await expect(chips.filter({ hasText: copy.chip2 })).toBeVisible();
    expect(await chips.count()).toBeGreaterThanOrEqual(4);
    // No database in e2e: no usage count, never a made-up one.
    await expect(page.getByText(/Used by|ተጠቅመውበታል/)).toHaveCount(0);

    // The preview sits in a frame with the address the site would get.
    const wide = (page.viewportSize()?.width ?? 0) >= 1024;
    const frame = page.locator(`[data-frame=${wide ? "browser" : "phone"}]`);
    await expect(frame).toBeVisible();
    await expect(frame.getByText(/bole-buna-house/)).toBeVisible();
    await expect(frame.getByText(copy.address)).toBeAttached();

    // Large screens: the summary beside the preview. Phones: summary, then the preview, then who it suits.
    const summary = await page.getByRole("region", { name: copy.current }).boundingBox();
    const box = await frame.boundingBox();
    const who = await page.getByRole("region", { name: copy.whoTitle }).boundingBox();
    if (!summary || !box || !who) throw new Error("layout not measured");
    if (wide) {
      expect(summary.x).toBeGreaterThanOrEqual(box.x + box.width);
      expect(who.x).toBeGreaterThanOrEqual(box.x + box.width);
    } else {
      expect(summary.y + summary.height).toBeLessThanOrEqual(box.y);
      expect(who.y).toBeGreaterThanOrEqual(box.y + box.height);
    }
    // Exactly one "Use this template" in view: beside the preview, or in the bar at the bottom.
    await expect(page.getByRole("link", { name: copy.use }).filter({ visible: true })).toHaveCount(1);
    await expect(page.locator("[data-use-bar]")).toBeVisible({ visible: !wide });
    if (wide) {
      // Far down a long preview, the button beside it is still in view (only the summary stays put).
      await page.mouse.wheel(0, 3000);
      await expect(page.getByRole("link", { name: copy.use }).filter({ visible: true })).toBeInViewport();
      await page.mouse.wheel(0, -3000);
    }

    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
    // The other layout fits too.
    await page.getByRole("button", { name: wide ? copy.phone : copy.computer }).click();
    await expect(page.locator(`[data-frame=${wide ? "phone" : "browser"}]`)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}

test("an unknown template answers 404", async ({ page }) => {
  const res = await page.goto("/en/templates/not-a-template");
  expect(res?.status()).toBe(404);
});

test("when a category hides every match, a link shows the matches in all templates", async ({ page }) => {
  await page.goto("/en/templates?category=food");
  await page.getByRole("searchbox", { name: "Search templates" }).fill("prayer");
  await expect(page.getByText("No template matches")).toBeVisible();
  await page.getByRole("link", { name: "See 1 matching in all templates" }).click();
  await expect(page).toHaveURL(/\/en\/templates$/);
  await expect(page.getByRole("list", { name: "Example sites" }).getByRole("listitem")).toHaveCount(1);
});
