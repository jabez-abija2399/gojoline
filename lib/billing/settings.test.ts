import { describe, expect, it } from "vitest";
import { MemoryEmailSender } from "@/lib/providers/notify/email";
import { MemoryTelegramClient } from "@/lib/telegram/client";
import { MemoryTelegramStore } from "@/lib/telegram/store";
import { noticeDecision, noticeNewPayment } from "./notify";
import { Billing } from "./service";
import { loadBillingSettings, MemorySettingsStore } from "./settings";
import { MemoryBillingStore } from "./store";


const paid = <T,>(r: { ok: true; payment: T } | { ok: false }) => (r.ok ? r.payment : null);

describe("billing settings", () => {
  it("defaults to plans.ts and env, and admins can change prices for new payments only", async () => {
    const settings = new MemorySettingsStore();
    const store = new MemoryBillingStore();
    const b = new Billing(store, () => new Date("2026-11-15T10:00:00Z"), settings);
    const env = { PAYMENT_TELEBIRR_NUMBER: "0911" } as unknown as NodeJS.ProcessEnv;
    expect((await loadBillingSettings(settings, env)).telebirrNumber).toBe("0911");
    const before = paid(await b.submitPayment("u", { product: "starter_month", method: "telebirr", reference: "AAA111", receipt: null }));
    expect(before?.amountMinor).toBe(49_900);
    const s = await b.settings();
    await b.saveSettings("admin", { ...s, prices: { ...s.prices, starter_month: 45_000 }, telebirrNumber: "0911 22 33 44" });
    expect((await b.settings()).prices.starter_month).toBe(45_000);
    const after = paid(await b.submitPayment("u", { product: "starter_month", method: "telebirr", reference: "BBB222", receipt: null }));
    expect(after?.amountMinor).toBe(45_000);
    expect((await store.payment(before!.id))?.amountMinor).toBe(49_900);
    expect((await store.auditFor("settings", "billing"))[0]?.action).toBe("settings.billing");
  });

  it("ignores broken saved settings instead of showing them", async () => {
    const settings = new MemorySettingsStore();
    await settings.set("billing", { prices: { topup: -5 } });
    expect((await loadBillingSettings(settings, {} as NodeJS.ProcessEnv)).prices.topup).toBe(24_900);
  });
});

describe("payment notices", () => {
  it("emails admins about new payments and tells the customer on Telegram", async () => {
    const email = new MemoryEmailSender();
    const store = new MemoryBillingStore();
    const tg = { store: new MemoryTelegramStore(), client: new MemoryTelegramClient() };
    await tg.store.link({ userId: "u", chatId: "7", username: null, locale: "am" });
    const deps = { email, appUrl: "https://gojoline.afridea.et", adminEmails: ["boss@example.com"], store, telegram: tg };
    const p = (await store.createPayment({ userId: "u", product: "topup", amountMinor: 24_900, method: "cbe", reference: "FT123", receipt: null }))!;
    await noticeNewPayment(deps, p);
    expect(email.sent[0]).toMatchObject({ to: "boss@example.com" });
    expect(email.sent[0]!.text).toContain("https://gojoline.afridea.et/en/admin?tab=payments");
    await noticeDecision(deps, p, "approve", null);
    expect(tg.client.sent.at(-1)?.html).toContain("ጸድቋል");
  });
});
