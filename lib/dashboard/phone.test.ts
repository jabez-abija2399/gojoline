import { describe, expect, it } from "vitest";
import { normalizePhone, phoneLinks } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["0911223344", "+251911223344"],
    ["0911 22 33 44", "+251911223344"],
    ["091-122-3344", "+251911223344"],
    ["911223344", "+251911223344"],
    ["251911223344", "+251911223344"],
    ["+251911223344", "+251911223344"],
    ["+251 911 223 344", "+251911223344"],
    ["00251911223344", "+251911223344"],
    ["0711223344", "+251711223344"],
    ["+251 7 11 22 33 44", "+251711223344"],
  ])("reads %s as an Ethiopian mobile", (raw, e164) => {
    expect(normalizePhone(raw)).toEqual({ e164, mobile: true });
  });

  it("knows a landline (no WhatsApp or Telegram for it)", () => {
    expect(normalizePhone("0116 61 22 33")).toEqual({ e164: "+251116612233", mobile: false });
    const links = phoneLinks("011 661 2233")!;
    expect(links.tel).toBe("tel:+251116612233");
    expect(links.whatsapp).toBeNull();
    expect(links.telegram).toBeNull();
  });

  it("keeps other countries' numbers with their code", () => {
    expect(normalizePhone("+44 20 7946 0958")).toEqual({ e164: "+442079460958", mobile: true });
    expect(normalizePhone("+1 (415) 555-0100")).toEqual({ e164: "+14155550100", mobile: true });
  });

  it.each(["", "hello", "12", "0911", "091122334455", "+251 811", "abc 0911223344", "0011223344", "2 people"])("refuses %s", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });
});

describe("phoneLinks", () => {
  it("builds call, SMS, WhatsApp and Telegram links", () => {
    expect(phoneLinks("0911 22 33 44")).toEqual({
      e164: "+251911223344",
      tel: "tel:+251911223344",
      sms: "sms:+251911223344",
      whatsapp: "https://wa.me/251911223344",
      telegram: "https://t.me/+251911223344",
    });
  });
});
