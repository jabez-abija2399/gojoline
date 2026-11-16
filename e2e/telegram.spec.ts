import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yIssues, signIn } from "./helpers";

const SECRET = "e2e-telegram-secret-0123456789";

test("connect Telegram from the dashboard (webhook simulated)", async ({ page, context }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Start a new site" }).click();
  await page.waitForURL(/\/build\/[0-9a-f-]{36}$/);
  const id = page.url().split("/").pop()!;
  await page.goto(`/en/dashboard/${id}?tab=telegram`);
  await expect(page.getByRole("heading", { name: "Get messages on Telegram" })).toBeVisible();
  await expectNoSeriousA11yIssues(page);

  const popup = context.waitForEvent("page").catch(() => null);
  await page.getByRole("button", { name: "Connect Telegram" }).click();
  await popup;
  const href = await page.getByRole("link", { name: "Open Telegram" }).getAttribute("href");
  const code = new URL(href!).searchParams.get("start")!;
  expect(href).toMatch(/^https:\/\/t\.me\/gojoline_bot\?start=/);

  // Without the secret, Telegram updates are refused.
  const bad = await page.request.post("/api/telegram/webhook", { data: { update_id: 1 } });
  expect(bad.status()).toBe(401);

  const res = await page.request.post("/api/telegram/webhook", {
    headers: { "x-telegram-bot-api-secret-token": SECRET },
    data: { update_id: Date.now(), message: { chat: { id: Date.now(), type: "private" }, from: { username: "abebe" }, text: `/start ${code}` } },
  });
  expect(res.status()).toBe(200);
  await expect(page.getByText("Connected to Telegram (@abebe).")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByRole("button", { name: "Connect Telegram" })).toBeVisible();
});
