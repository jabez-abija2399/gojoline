import { describe, expect, it } from "vitest";
import { ownerOpen, posterName, qrTarget, shareLinks } from "./share";

describe("share helpers", () => {
  it("adds ?src=qr for printed codes and #me for the owner's own visits", () => {
    expect(qrTarget("https://selam.afridea.et")).toBe("https://selam.afridea.et/?src=qr");
    expect(qrTarget("https://selamcafe.com/?a=1")).toBe("https://selamcafe.com/?a=1&src=qr");
    expect(ownerOpen("https://selam.afridea.et")).toBe("https://selam.afridea.et/#me");
  });
  it("builds share links", () => {
    const l = shareLinks("https://selam.afridea.et", "Visit Selam");
    expect(l.telegram).toBe("https://t.me/share/url?url=https%3A%2F%2Fselam.afridea.et&text=Visit%20Selam");
    expect(l.whatsapp).toBe("https://wa.me/?text=Visit%20Selam%20https%3A%2F%2Fselam.afridea.et");
    expect(l.facebook).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fselam.afridea.et");
  });
  it("names the poster file after the site", () => {
    expect(posterName("Selam Café, Bole!")).toBe("selam-cafe-bole-qr.png");
    expect(posterName("ሰላም ካፌ")).toBe("site-qr.png");
  });
});
