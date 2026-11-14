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
        env: { E2E: "1", WAITLIST_RATE_LIMIT_PER_MIN: "1000", OTP_SEND_PER_IP_PER_HOUR: "1000", BUILDER_RATE_LIMIT_PER_HOUR: "1000" },
      },
});
