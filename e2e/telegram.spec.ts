import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues, signIn } from "./helpers";

const SECRET = "e2e-telegram-secret-0123456789";

/** Puts the signed-in owner on a plan (Free: the subscription lapses), with changes to spare. */
async function setPlan(page: Page, plan: "free" | "starter" | "business") {
  expect((await page.request.post("/api/test/credits", { data: { left: 20, plan } })).status()).toBe(200);
}

/** Opens the bot link from Settings and finishes it the way Telegram would (webhook simulated). */
async function connectTelegram(page: Page, chatId: number, username: string) {
  const popup = page.context().waitForEvent("page").catch(() => null);
  await page.getByRole("button", { name: "Connect Telegram" }).click();
  await popup;
  const href = await page.getByRole("link", { name: "Open Telegram" }).getAttribute("href");
  expect(href).toMatch(/^https:\/\/t\.me\/gojoline_bot\?start=/);
  const code = new URL(href!).searchParams.get("start")!;
  const res = await page.request.post("/api/telegram/webhook", {
    headers: { "x-telegram-bot-api-secret-token": SECRET },
    data: { update_id: Date.now(), message: { chat: { id: chatId, type: "private" }, from: { username }, text: `/start ${code}` } },
  });
  expect(res.status()).toBe(200);
  await expect(page.getByText(`Connected to Telegram (@${username}).`)).toBeVisible({ timeout: 10_000 });
}

/** Signs in, builds a site from one message and publishes it. Returns the project id. */
async function publishedSite(page: Page, info: TestInfo): Promise<string> {
  await page.getByRole("button", { name: "Start a new site" }).click();
  const chat = page.getByRole("textbox", { name: "Your message" });
  await chat.fill("Bole Buna");
  await chat.press("Enter");
  await expect(page.getByText("Saved as version 1").first()).toBeVisible();
  const projectId = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Your site's address")).toHaveValue(/\w/);
  await page.getByLabel("Your site's address").fill(`tg-${info.project.name}-${Date.now().toString(36)}`);
  await page.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByRole("heading", { name: "Your site is live!" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  return projectId;
}

test("Free plan: Telegram alerts are shown with an Upgrade link, not a Connect button", async ({ page }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  await page.waitForURL(/\/build\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  await page.goto(`/en/dashboard/${id}?tab=telegram`);
  const card = page.getByRole("region", { name: "Get messages on Telegram" });
  await expect(card.getByText("Available on Starter and Business")).toBeVisible();
  await expect(card.getByText("On the Free plan, new bookings, orders and messages wait for you in Messages.", { exact: false })).toBeVisible();
  await expect(card.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/en/billing");
  await expect(card.getByRole("button", { name: "Connect Telegram" })).toHaveCount(0);
  // The server refuses a new link on Free too.
  expect((await page.request.post("/api/telegram/link", { data: { locale: "en" } })).status()).toBe(403);
  await expectNoSeriousA11yIssues(page);
  await expectNoHorizontalScroll(page);
});

test("Telegram alerts: sent on Starter, paused on Free with the link kept, back after upgrading", async ({ page }, info) => {
  test.setTimeout(120_000);
  await signIn(page);
  await setPlan(page, "starter");
  const projectId = await publishedSite(page, info);
  // The sample booking form on the live site, and what the site sends with each answer.
  expect((await page.request.post("/api/test/answers", { data: { projectId, count: 1 } })).status()).toBe(200);
  const creds = await page.request.get(`/api/test/site?projectId=${projectId}`);
  const { siteKey, origin } = (await creds.json()) as { siteKey: string; origin: string };
  let n = 0;
  const book = async (name: string) => {
    const res = await page.request.post(`/api/public/sites/${projectId}/forms/booking`, {
      headers: { Origin: origin, "x-site-key": siteKey, "Content-Type": "application/json", "X-Real-IP": `10.9.0.${++n}` },
      data: { answers: { name, phone: "0900000000", people: "2" }, lang: "en", _hp: "", _ms: 5000 },
    });
    expect(res.status()).toBe(201);
  };
  const chatId = Date.now() * 10 + (info.project.name === "mobile" ? 1 : 2);
  const alerts = async () => ((await (await page.request.get(`/api/test/telegram?chatId=${chatId}`)).json()) as { sent: string[] }).sent.filter((h) => h.includes("Bole Buna") || h.includes("Booking"));

  // Starter: connect, and a booking reaches Telegram.
  await page.goto(`/en/dashboard/${projectId}?tab=settings`);
  const card = page.getByRole("region", { name: "Get messages on Telegram" });
  await expect(card.getByText("Available on Starter and Business")).toHaveCount(0);
  await expect(card.getByText("You can also send changes and photos to the bot.", { exact: false })).toHaveCount(0);
  await connectTelegram(page, chatId, "abebe");
  const before = (await alerts()).length;
  await book("Hana Tesfaye");
  await expect.poll(async () => (await alerts()).length).toBe(before + 1);
  expect((await alerts()).at(-1)).toContain("Hana Tesfaye");

  // Back on Free: the link stays, nothing is sent, and the booking still waits in Messages.
  await setPlan(page, "free");
  await page.reload();
  await expect(card.getByText("Connected to Telegram (@abebe).")).toBeVisible();
  await expect(card.getByText("Alerts are off on the Free plan.", { exact: false })).toBeVisible();
  await expect(card.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/en/billing");
  await book("Dawit Alemu");
  await page.goto(`/en/dashboard/${projectId}?tab=messages`);
  await expect(page.getByText("Dawit Alemu").first()).toBeVisible();
  expect((await alerts()).length).toBe(before + 1);

  // Upgraded again: alerts resume without connecting again.
  await setPlan(page, "starter");
  await book("Selam Girma");
  await expect.poll(async () => (await alerts()).length).toBe(before + 2);
  expect((await alerts()).at(-1)).toContain("Selam Girma");

  // Without the secret, Telegram updates are refused; Disconnect still works.
  expect((await page.request.post("/api/telegram/webhook", { data: { update_id: 1 } })).status()).toBe(401);
  await page.goto(`/en/dashboard/${projectId}?tab=settings`);
  await card.getByRole("button", { name: "Disconnect" }).click();
  await expect(card.getByRole("button", { name: "Connect Telegram" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);
});
