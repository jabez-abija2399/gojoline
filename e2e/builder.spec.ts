import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

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

  await page.getByRole("tab", { name: "Files" }).filter({ visible: true }).click();
  await expect(page.locator("pre:visible")).toContainText('"en": "Selam Coffee"');

  // The project is named after the site.
  await page.goto("/en/build");
  await expect(page.getByRole("link", { name: /Selam Coffee/ })).toBeVisible();
});

test("a change that breaks the site is undone", async ({ page }) => {
  await newSite(page);
  await chat(page).fill("break it");
  await chat(page).press("Enter");
  await expect(page.getByText("I couldn't finish this change").first()).toBeVisible();
  await page.getByRole("tab", { name: "Versions" }).filter({ visible: true }).click();
  await expect(page.getByText("No versions yet").filter({ visible: true })).toBeVisible();
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
  const api = await other.request.get(`/api/projects/${id}/files`);
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
  await group.getByText("English and Amharic").click();
  await expect(group.getByRole("radio", { name: "English and Amharic" })).toBeChecked();
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
