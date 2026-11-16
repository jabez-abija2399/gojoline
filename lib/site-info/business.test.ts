import { describe, expect, it } from "vitest";
import { businessInfo, groupHours, mapLink, publicPatch, type InfoLabels } from "./business";

const en: InfoLabels = { days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" }, closed: "Closed", closedToday: "Closed today", closedForNow: "Closed for now" };
const am: InfoLabels = { days: { mon: "ሰኞ", tue: "ማክሰኞ", wed: "ረቡዕ", thu: "ሐሙስ", fri: "ዓርብ", sat: "ቅዳሜ", sun: "እሁድ" }, closed: "ዝግ", closedToday: "ዛሬ ዝግ ነው", closedForNow: "ለጊዜው ዝግ ነው" };
const labels = { en, am };

describe("businessInfo validation", () => {
  it("accepts a full set of details and cleans the Telegram name", () => {
    const r = businessInfo.parse({
      phone: "0911 22 33 44",
      telegram: "@selam_cafe",
      whatsapp: "+251911223344",
      address: { en: "Bole, Addis Ababa", am: "ቦሌ፣ አዲስ አበባ" },
      hours: { mon: { open: "08:00", close: "18:00" }, sun: null },
      closedOn: "2026-11-16",
      closedForNow: false,
      announcement: { on: true, text: { en: "New: fresh juice", am: "" } },
    });
    expect(r.telegram).toBe("selam_cafe");
    expect(businessInfo.parse({ telegram: "https://t.me/selam_cafe" }).telegram).toBe("selam_cafe");
  });

  it.each([
    [{ phone: "call me" }],
    [{ whatsapp: "12" }],
    [{ telegram: "ab" }],
    [{ telegram: "has space" }],
    [{ address: { en: "x".repeat(161) } }],
    [{ announcement: { on: true, text: { en: "x".repeat(121) } } }],
    [{ hours: { mon: { open: "8:00", close: "18:00" } } }],
    [{ hours: { mon: { open: "08:00", close: "08:00" } } }],
    [{ hours: { funday: null } }],
    [{ closedOn: "today" }],
    [{ extra: "field" }],
  ])("refuses %j", (input) => {
    expect(businessInfo.safeParse(input).success).toBe(false);
  });
});

describe("groupHours", () => {
  it("groups matching weekdays and says closed in both languages", () => {
    const open = { open: "08:00", close: "18:00" };
    const rows = groupHours({ mon: open, tue: open, wed: open, thu: open, fri: open, sat: { open: "09:00", close: "13:00" }, sun: null }, labels);
    expect(rows).toEqual([
      { days: { en: "Mon–Fri", am: "ሰኞ–ዓርብ" }, time: { en: "08:00–18:00", am: "08:00–18:00" } },
      { days: { en: "Sat", am: "ቅዳሜ" }, time: { en: "09:00–13:00", am: "09:00–13:00" } },
      { days: { en: "Sun", am: "እሁድ" }, time: { en: "Closed", am: "ዝግ" } },
    ]);
  });
  it("skips days without hours set", () => {
    expect(groupHours({ wed: null }, labels)).toEqual([{ days: { en: "Wed", am: "ረቡዕ" }, time: { en: "Closed", am: "ዝግ" } }]);
  });
});

describe("publicPatch", () => {
  const now = Date.parse("2026-11-16T10:00:00Z");
  it("is empty without details", () => {
    expect(publicPatch(null, labels, now)).toEqual({});
    expect(publicPatch({ phone: "", telegram: "", address: { en: " " } }, labels, now)).toEqual({});
  });
  it("shows the closed-today notice only on that Addis Ababa day, before the owner's line", () => {
    const info = { closedOn: "2026-11-16", announcement: { on: true, text: { en: "Fresh juice" } } };
    expect(publicPatch(info, labels, now).announcement).toEqual([{ en: "Closed today", am: "ዛሬ ዝግ ነው" }, { en: "Fresh juice" }]);
    expect(publicPatch(info, labels, Date.parse("2026-11-16T21:30:00Z")).announcement).toEqual([{ en: "Fresh juice" }]);
  });
  it("hides the banner when it is off, and says closed for now", () => {
    expect(publicPatch({ closedForNow: true, announcement: { on: false, text: { en: "Hi" } } }, labels, now).announcement).toEqual([{ en: "Closed for now", am: "ለጊዜው ዝግ ነው" }]);
  });
  it("gives WhatsApp as digits and keeps the phone as typed", () => {
    expect(publicPatch({ phone: "0911 22 33 44", whatsapp: "0911223344" }, labels, now).business).toEqual({ phone: "0911 22 33 44", whatsapp: "251911223344" });
  });
});

it("links an address to a map search", () => {
  expect(mapLink("Bole, Addis Ababa")).toBe("https://www.google.com/maps/search/?api=1&query=Bole%2C%20Addis%20Ababa");
});
