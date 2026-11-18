import { describe, expect, it } from "vitest";
import { CODE_LENGTH, mailbox, newReferralCode, referralLink, selfReferral } from "./referral-rules";
import { referralCodeOf } from "./attribution";

const p = (id: string, email: string | null, phone: string | null = null) => ({ id, email, phone });

describe("selfReferral", () => {
  it("allows a different owner, even on the same public mail service", () => {
    expect(selfReferral(p("a", "abebe@gmail.com"), p("b", "sara@gmail.com"))).toBeNull();
    expect(selfReferral(p("a", null, "+251911223344"), p("b", null, "+251911556677"))).toBeNull();
  });
  it("refuses the same account, mailbox, company domain or phone", () => {
    expect(selfReferral(p("a", "x@y.com"), p("a", "z@w.com"))).toBe("same_user");
    expect(selfReferral(p("a", "Abebe.K@gmail.com"), p("b", "abebek+2@googlemail.com"))).toBe("same_email");
    expect(selfReferral(p("a", "owner@selamcoffee.et"), p("b", "cashier@selamcoffee.et"))).toBe("same_domain");
    expect(selfReferral(p("a", null, "+251911223344"), p("b", null, "0911 223 344"))).toBe("same_phone");
  });
  it("normalises mailboxes", () => {
    expect(mailbox(" A.B+tag@GMAIL.com ")).toBe("ab@gmail.com");
    expect(mailbox("a.b@company.et")).toBe("a.b@company.et");
  });
});

describe("codes and links", () => {
  it("makes short unambiguous codes the attribution parser accepts", () => {
    const code = newReferralCode();
    expect(code).toMatch(new RegExp(`^[a-hjkmnp-z2-9]{${CODE_LENGTH}}$`));
    const link = referralLink("https://gojoline.afridea.et/x", "am", code);
    expect(link).toBe(`https://gojoline.afridea.et/am?ref=u_${code}`);
    expect(referralCodeOf({ r: new URL(link).searchParams.get("ref")!, t: 0 })).toBe(code);
  });
});
