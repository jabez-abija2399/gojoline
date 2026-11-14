import { describe, expect, it } from "vitest";
import { normalizeEthiopianPhone, parseContact } from "./contact";

describe("normalizeEthiopianPhone", () => {
  it.each([
    ["0911234567", "+251911234567"],
    ["0911 234 567", "+251911234567"],
    ["+251 911-234-567", "+251911234567"],
    ["251911234567", "+251911234567"],
    ["911234567", "+251911234567"],
    ["0712345678", "+251712345678"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeEthiopianPhone(input)).toBe(expected);
  });

  it.each(["12345", "0111234567", "+1 202 555 0100", "09112345678", "abc"])("rejects %s", (input) => {
    expect(normalizeEthiopianPhone(input)).toBeNull();
  });
});

describe("parseContact", () => {
  it("lower-cases emails", () => {
    expect(parseContact(" Abebe@Example.com ")).toEqual({ kind: "email", value: "abebe@example.com" });
  });
  it("parses phones", () => {
    expect(parseContact("0911234567")).toEqual({ kind: "phone", value: "+251911234567" });
  });
  it("rejects junk and empty", () => {
    expect(parseContact("not@valid")).toBeNull();
    expect(parseContact("   ")).toBeNull();
  });
});
