import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL, trace: "off" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx next start -p ${PORT}`,
        url: `${baseURL}/en`,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        // Every test shares one IP; keep per-IP limits out of the way of the suite.
        env: { E2E: "1", WAITLIST_RATE_LIMIT_PER_MIN: "1000", OTP_SEND_PER_IP_PER_HOUR: "1000", BUILDER_RATE_LIMIT_PER_HOUR: "1000", TELEGRAM_WEBHOOK_SECRET: "e2e-telegram-secret-0123456789", PAYMENT_TELEBIRR_NUMBER: "0911000000", PAYMENT_CBE_ACCOUNT: "1000123456789", PAYMENT_ACCOUNT_NAME: "Gojoline", ADMIN_EMAILS: "admin-e2e-pay-mobile@example.com,admin-e2e-pay-desktop@example.com,admin-e2e-set-mobile@example.com,admin-e2e-set-desktop@example.com,admin-e2e-mod-mobile@example.com,admin-e2e-mod-desktop@example.com,admin-e2e-own-mobile@example.com,admin-e2e-own-desktop@example.com,admin-e2e-am-mobile@example.com,admin-e2e-am-desktop@example.com,admin-e2e-dash-mobile@example.com,admin-e2e-dash-desktop@example.com,admin-e2e-cr-mobile@example.com,admin-e2e-cr-desktop@example.com,admin-e2e-disc-mobile@example.com,admin-e2e-disc-desktop@example.com,admin-e2e-offer-mobile@example.com,admin-e2e-offer-desktop@example.com,admin-e2e-fb-mobile@example.com,admin-e2e-fb-desktop@example.com,admin-e2e-grow-mobile@example.com,admin-e2e-grow-desktop@example.com,admin-e2e-show-mobile@example.com,admin-e2e-show-desktop@example.com,admin-e2e-an-mobile@example.com,admin-e2e-an-desktop@example.com,admin-e2e-posts-mobile@example.com,admin-e2e-posts-desktop@example.com" },
      },
});
