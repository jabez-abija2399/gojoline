import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11yIssues } from "./helpers";

for (const lang of ["en", "am"] as const) {
  test(`privacy and terms pages in ${lang}, linked from the footer`, async ({ page }) => {
    await page.goto(`/${lang}`);
    await page.getByRole("navigation", { name: lang === "en" ? "Legal and safety" : "ሕግ እና ደኅንነት" }).getByRole("link", { name: lang === "en" ? "Privacy" : "ግላዊነት" }).click();
    await expect(page.getByRole("heading", { level: 1, name: lang === "en" ? "Privacy policy" : "የግላዊነት ፖሊሲ" })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expectNoSeriousA11yIssues(page);
    await page.goto(`/${lang}/terms`);
    await expect(page.getByRole("heading", { level: 1, name: lang === "en" ? "Terms of use" : "የአጠቃቀም ውሎች" })).toBeVisible();
    await expectNoSeriousA11yIssues(page);
  });
}

test("health check answers for uptime monitoring", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true });
  expect(res.headers()["cache-control"]).toContain("no-store");
});
