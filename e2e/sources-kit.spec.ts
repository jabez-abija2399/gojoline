import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

test("a short link goes home with its tags and counts in Admin → Sources", async ({ page }, info) => {
  const res = await page.request.get("/r/ig", { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers().location).toMatch(/\/\?utm_source=instagram&utm_medium=bio&utm_campaign=link-ig$/);
  expect((await page.request.get("/r/nope", { maxRedirects: 0 })).headers().location).toMatch(/\/$/);

  await signIn(page, { contact: `admin-e2e-src-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=sources");
  await expect(page.getByRole("heading", { name: "Sources", level: 1 })).toBeVisible();
  const links = page.getByRole("table", { name: "Your short links" });
  await expect(links.getByRole("rowheader", { name: "Instagram · profile link" })).toBeVisible();
  await expect(links).toContainText("/r/ig");
  await expect(page.getByRole("heading", { name: "Where new owners came from" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await expectNoSeriousA11yIssues(page);
});

test("Telegram start: the first posts, sent to the channel in one click and marked as posted", async ({ page }, info) => {
  await signIn(page, { contact: `admin-e2e-src-${info.project.name}@example.com` });
  await page.goto("/en/admin?tab=posts&view=kit");
  await expect(page.getByRole("heading", { name: "Your channel's first posts" })).toBeVisible();
  const cards = page.locator("li[id^=kit-]");
  await expect(cards).toHaveCount(7);
  if (info.project.name === "mobile") {
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
    return;
  }
  const quiz = page.locator("#kit-quiz");
  page.once("dialog", (d) => d.accept());
  await quiz.getByRole("button", { name: "Send to channel: Quiz" }).click();
  await expect(page.locator("#kit-quiz").getByRole("status")).toHaveText("Sent to your channel and marked as posted.");
  await expect(page.locator("#kit-quiz")).toContainText("Posted");
  await page.locator("#kit-quiz").getByRole("button", { name: "Mark as not posted: Quiz" }).click();
  await expect(page.locator("#kit-quiz").getByRole("status")).toHaveText("Saved.");
  await expect(page.locator("#kit-quiz")).not.toContainText("Posted ");
});
