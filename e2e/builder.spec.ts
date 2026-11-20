import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, openAccountMenu, openAppMenu, signIn } from "./helpers";

// Runs against the deterministic demo AI and in-memory sandbox (E2E=1): no cost, no network.
async function newSite(page: import("@playwright/test").Page, lang: "en" | "am" = "en", signedIn = false) {
  if (!signedIn) await signIn(page, { lang });
  await page.goto(`/${lang}/build`);
  await page.getByRole("button", { name: lang === "en" ? "Start a new site" : "አዲስ ድረ-ገጽ ይጀምሩ" }).click();
  await expect(page).toHaveURL(new RegExp(`/${lang}/build/[0-9a-f-]{36}$`));
}

function chat(page: import("@playwright/test").Page) {
  return page.getByRole("textbox", { name: /Your message|መልዕክትዎ/ });
}

test("create a site, edit it by chat, see versions and restore", async ({ page }, info) => {
  await newSite(page);
  if (info.project.name === "mobile") await expect(page.getByRole("tab", { name: "Chat" })).toHaveAttribute("aria-selected", "true");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  await chat(page).fill("Selam Coffee");
  await chat(page).press("Enter");
  await expect(page.getByText("Done. I updated your site.").first()).toBeVisible();
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();

  await chat(page).fill("Abol Cafe");
  await page.getByRole("button", { name: "Send" }).filter({ visible: true }).click();
  await expect(page.getByText("Saved as version 2").first()).toBeVisible();

  await page.getByRole("tab", { name: "Versions" }).filter({ visible: true }).click();
  await expect(page.getByText("Showing now").filter({ visible: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Bring back" }).filter({ visible: true }).first().click();
  await expect(page.getByText("Version 3", { exact: true }).filter({ visible: true })).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  // No code view for owners: they change the site through the chat and the dashboard.
  await expect(page.getByRole("tab", { name: "Advanced" })).toHaveCount(0);
  expect((await page.request.get(`/api/projects/${page.url().split("/").pop()}/files`)).status()).toBe(404);

  // The project is named after the site.
  await page.goto("/en/build");
  const card = page.getByRole("main").getByRole("listitem").filter({ hasText: "Selam Coffee" });
  await expect(card.getByRole("link", { name: "Selam Coffee", exact: true })).toBeVisible();
  await expect(card.getByText("Not published", { exact: true }).last()).toBeVisible();
  await expect(card.getByText(/^Changed /)).toBeVisible();
});

test("a change that breaks the site is undone", async ({ page }) => {
  await newSite(page);
  await chat(page).fill("break it");
  await chat(page).press("Enter");
  await expect(page.getByText("I couldn't finish this change").first()).toBeVisible();
  await page.getByRole("tab", { name: "Versions" }).filter({ visible: true }).click();
  await expect(page.getByText("No versions yet").filter({ visible: true })).toBeVisible();
});

test("the progress card follows the AI's real steps, and replies show bold and lists without asterisks", async ({ page }) => {
  await newSite(page);
  // "slowly" makes the demo AI pause after it starts writing and building.
  await chat(page).fill("Selam Coffee slowly");
  await chat(page).press("Enter");
  // The chat's card (the preview's first-build placeholder has the same name).
  const card = page.getByRole("tabpanel", { name: "Chat" }).getByRole("group", { name: "Building your site" });
  await expect(card).toContainText("Understanding your request (done)");
  await expect(card).toContainText("Writing your site (done)");
  await expect(card).toContainText("Checking everything works (in progress)");
  // Screen readers hear only the current step, from one quiet status line.
  await expect(card.getByRole("status")).toHaveText("Checking everything works");
  // The AI's working notes (colours, contrast checks) never show on the card or in the chat.
  await expect(page.getByText(/B85C7A|contrast vs/)).toHaveCount(0);
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  await expect(card).toHaveCount(0);
  await expect(page.getByText(/B85C7A|contrast vs/)).toHaveCount(0);

  await chat(page).fill("Add our Telegram");
  await chat(page).press("Enter");
  const reply = page.locator("li").filter({ hasText: "Your Telegram username" });
  await expect(reply.locator("strong")).toHaveText("Your Telegram username");
  await expect(page.getByText("**Your Telegram username**")).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("the progress card speaks Amharic", async ({ page }) => {
  await newSite(page, "am");
  await chat(page).fill("ሰላም ቡና slowly");
  await chat(page).press("Enter");
  const card = page.getByRole("tabpanel", { name: "ውይይት" }).getByRole("group", { name: "ድረ-ገጽዎ እየተሠራ ነው" });
  await expect(card).toContainText("ጥያቄዎን በመረዳት ላይ (ተጠናቋል)");
  await expect(card).toContainText("ሁሉም ነገር መሥራቱን በማረጋገጥ ላይ (በሂደት ላይ)");
  await expectNoHorizontalScroll(page);
  await expect(card).toHaveCount(0, { timeout: 15_000 });
});

test("builder works in Amharic", async ({ page }) => {
  await newSite(page, "am");
  await expect(page.locator("html")).toHaveAttribute("lang", "am");
  await chat(page).fill("question");
  await chat(page).press("Enter");
  await expect(page.getByText("What is your business called?")).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("projects are private to their owner", async ({ page, browser, request }) => {
  await newSite(page);
  const url = page.url();
  const id = url.split("/").pop()!;
  const other = await browser.newContext();
  const stranger = await other.newPage();
  // Signed out, the stranger is sent to sign in.
  await stranger.goto(url);
  await expect(stranger).toHaveURL(/\/en\/sign-in/);
  // With their own account they get a 404 for someone else's project.
  await newSite(stranger);
  const res = await stranger.goto(url);
  expect(res?.status()).toBe(404);
  const api = await other.request.get(`/api/projects/${id}/publish`);
  expect([401, 404]).toContain(api.status());
  // Cross-site POSTs are refused.
  const csrf = await request.post(`/api/projects/${id}/messages`, { data: { text: "hi" }, headers: { origin: "https://evil.example" } });
  expect(csrf.status()).toBe(403);
  await other.close();
});

test("the owner picks the site's languages before the first build", async ({ page }) => {
  await newSite(page);
  const group = page.getByRole("group", { name: "Your site's language" });
  await expect(group.getByRole("radio", { name: "English", exact: true })).toBeChecked();
  await group.getByText("Both").click();
  await expect(group.getByRole("radio", { name: "Both" })).toBeChecked();
  let sent: unknown = null;
  page.on("request", (r) => {
    if (r.url().endsWith("/messages") && r.method() === "POST") sent = r.postDataJSON();
  });
  await chat(page).fill("Bole Bakery");
  await chat(page).press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  expect(sent).toMatchObject({ languages: ["en", "am"] });
  // Once the site exists the choice is gone: languages change by asking.
  await expect(page.getByRole("group", { name: "Your site's language" })).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);
});

test("describe the business on Your sites: the new site opens and builds itself", async ({ page }, info) => {
  await signIn(page);
  // An idea fills the box with an example to edit.
  await page.getByRole("button", { name: "Café", exact: true }).click();
  const box = page.getByRole("textbox", { name: "What will you build today?" });
  await expect(box).toHaveValue(/Selam Coffee/);
  await box.fill("Kaldi Books");
  await page.getByRole("group", { name: "Site language" }).getByText("Both").click();
  let sent: unknown = null;
  page.on("request", (r) => {
    if (r.url().endsWith("/messages") && r.method() === "POST") sent = r.postDataJSON();
  });
  await page.getByRole("button", { name: "Start a new site" }).click();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}(\?setup=1)?$/);
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  expect(sent).toMatchObject({ text: "Kaldi Books", languages: ["en", "am"] });
  await expect(page.getByText("Your site is ready!")).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  // Next steps fill the message box; nothing is sent until the owner says so.
  await page.getByRole("button", { name: "Change the colours" }).click();
  await expect(chat(page)).toHaveValue("Change the colours to ");
  await expect(chat(page)).toBeFocused();

  if (info.project.name === "mobile") {
    // Phones: the Preview tab says there is something new, and one tap shows the site.
    await expect(page.getByRole("tab", { name: /Preview.*updated/ })).toBeVisible();
    await page.getByRole("button", { name: "See your site" }).click();
    await expect(page.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
    // The less-used links sit behind "More".
    await page.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("link", { name: "Plan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "Plan" })).toBeHidden();
  }

  // Reloading doesn't send the description a second time.
  await page.reload();
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  await expect(page.getByText("Saved as version 2")).toHaveCount(0);
});

test("photos: add one in the builder and hand it to the chat", async ({ page }) => {
  await newSite(page);
  await chat(page).fill("Selam Coffee");
  await chat(page).press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();

  await page.getByRole("tab", { name: "Photos" }).filter({ visible: true }).click();
  await expect(page.getByText("No photos yet.").filter({ visible: true })).toBeVisible();
  const picker = page.getByRole("tabpanel", { name: "Photos" }).locator('input[type="file"]');
  await picker.setInputFiles("e2e/fixtures/fake.jpg");
  await expect(page.getByText("That file isn't a photo we can use")).toBeVisible();
  await picker.setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);

  // One tap puts the photo in the message; the owner says where it goes.
  await page.getByRole("button", { name: "Use in my site: Photo 1" }).click();
  await expect(chat(page)).toHaveValue(/Use my photo .photo.*\.\w+. $/);
  await expect(chat(page)).toBeFocused();

  // The chat box can add a photo too.
  await chat(page).fill("");
  await page.getByRole("tabpanel", { name: "Chat" }).locator('input[type="file"]').setInputFiles("e2e/fixtures/photo.jpg");
  await expect(page.getByText("Photo added. Now say where it should go.")).toBeVisible();
  await expect(chat(page)).toHaveValue(/Use my photo /);

  await page.getByRole("tab", { name: "Photos" }).filter({ visible: true }).click();
  await page.getByRole("button", { name: "Remove photo 2" }).click();
  await expect(page.getByRole("img", { name: "Photo 2" })).toHaveCount(0);
});

test("undo the newest change for free; the changes left are shown and the menu opens on phones", async ({ page }, info) => {
  await newSite(page);
  await chat(page).fill("Selam Coffee");
  await chat(page).press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  // Nothing earlier to go back to yet.
  await expect(page.getByRole("button", { name: "Undo this change" })).toHaveCount(0);
  await chat(page).fill("Abol Cafe");
  await chat(page).press("Enter");
  await expect(page.getByText("Saved as version 2").first()).toBeVisible();
  // The first build was free; the second message used one of the 10 Free changes.
  await expect(page.getByRole("link", { name: "9 changes left" })).toBeVisible();
  await page.getByRole("button", { name: "Undo this change" }).click();
  await expect(page.getByRole("log", { name: "Chat" }).getByText("Brought back version 1")).toBeVisible();
  // Undoing an undo would bring the change back: no second button, and focus is in the message box.
  await expect(page.getByRole("button", { name: "Undo this change" })).toHaveCount(0);
  await expect(chat(page)).toBeFocused();
  // Undo is a restore, not an AI change: the count stays.
  await expect(page.getByRole("link", { name: "9 changes left" })).toBeVisible();

  await page.goto("/en/build");
  await openAppMenu(page);
  const nav = page.getByRole(info.project.name === "mobile" ? "dialog" : "complementary", { name: "Gojoline menu" });
  await expect(nav.getByRole("link", { name: /Selam Coffee/ })).toBeVisible();
  await expect(nav.getByRole("link", { name: /9 changes left/ })).toBeVisible();
  // Sign out waits behind the account menu.
  await expect(nav.getByRole("button", { name: "Sign out" })).toBeHidden();
  await nav.getByRole("button", { name: /Account menu/ }).click();
  await expect(nav.getByRole("button", { name: "Sign out" })).toBeVisible();
  // The page behind an open phone menu can't be reached.
  if (info.project.name === "mobile") await expect(page.locator("#app-content")).toHaveAttribute("inert", "");
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("on a short window the recent sites scroll and never cover the changes-left card", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "the desktop sidebar");
  await signIn(page);
  for (const id of ["cafe", "hotel", "clinic", "school", "shop"]) {
    await page.goto("/en/build#templates");
    await page.locator(`form[data-preset=${id}] button`).click();
    await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}(\?setup=1)?$/);
  }
  await page.setViewportSize({ width: 1280, height: 560 });
  await page.goto("/en/build");
  const { listBottom, cardTop } = await page.evaluate(() => ({
    listBottom: document.querySelector("[aria-labelledby=recent-title]")!.getBoundingClientRect().bottom,
    cardTop: document.getElementById("credits-title")!.closest("a")!.getBoundingClientRect().top,
  }));
  expect(listBottom).toBeLessThanOrEqual(cardTop);
});

test("dark mode: chosen in the account menu, remembered, readable everywhere", async ({ page }, info) => {
  await signIn(page);
  await page.goto("/en/billing");
  await openAccountMenu(page);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  // The whole page goes dark, not only the area inside it (scroll bars, overscroll).
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("dark");
  if (info.project.name === "mobile") {
    // The veil behind the open menu stays dark (it is not built from ink, which turns light).
    const veil = await page.locator("#app-sidebar").locator("xpath=preceding-sibling::div[1]").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(veil).toMatch(/rgba?\(0, 0, 0/);
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
  }
  // Back shows the earlier page in the new theme too.
  await page.goto("/en/build");
  await page.goBack();
  await expect(page.locator("[data-gojo-theme]").first()).toHaveAttribute("data-gojo-theme", "dark");
  await page.goto("/en/build");
  await expect(page.locator("#app-content").locator("xpath=..")).toHaveAttribute("data-gojo-theme", "dark");
  await page.reload();
  await expect(page.locator("[data-gojo-theme]").first()).toHaveAttribute("data-gojo-theme", "dark");
  await expectNoSeriousA11yIssues(page);
  await page.getByRole("tab", { name: "Templates" }).click();
  await page.locator("form[data-preset=cafe] button").click();
  await expect(page).toHaveURL(/\/en\/build\/[0-9a-f-]{36}(\?setup=1)?$/);
  await expect(page.locator("[data-gojo-theme]").first()).toHaveAttribute("data-gojo-theme", "dark");
  await expectNoSeriousA11yIssues(page);
  await page.goto("/en/billing");
  await expectNoSeriousA11yIssues(page);
});

test("the sidebar never scrolls", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "the desktop sidebar");
  await signIn(page);
  await page.setViewportSize({ width: 1280, height: 520 });
  await page.goto("/en/build");
  const side = page.locator("#app-sidebar");
  expect(await side.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(0);
  expect(await side.evaluate((el) => getComputedStyle(el).overflowY)).toBe("hidden");
});

test("on a phone held sideways the account menu can still be reached", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "phones only");
  await signIn(page, { lang: "am" });
  await page.setViewportSize({ width: 740, height: 360 });
  await page.getByRole("button", { name: "ማውጫ", exact: true }).click();
  const account = page.getByRole("button", { name: /የመለያ ማውጫ/ });
  await account.scrollIntoViewIfNeeded();
  await account.click();
  await expect(page.getByRole("button", { name: "ይውጡ" })).toBeVisible();
});
