import { describe, expect, it } from "vitest";
import {
  canonicalHiddenCode,
  canonicalSerial,
  decrypt,
  encrypt,
  generateHiddenCode,
  generateSerial,
  maskEmail,
} from "@/lib/crypto";
import { safeNext } from "@/lib/safe-next";

describe("serial numbers", () => {
  it("generates the ONC-XXXX-XXXX format without look-alike letters", () => {
    for (let i = 0; i < 500; i++) expect(generateSerial()).toMatch(/^ONC-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
  });

  it("is not sequential: 2,000 serials are all different", () => {
    expect(new Set(Array.from({ length: 2000 }, generateSerial)).size).toBe(2000);
  });

  it("accepts what people actually type", () => {
    expect(canonicalSerial("ONC-7K3P-9QXM")).toBe("ONC-7K3P-9QXM");
    expect(canonicalSerial("onc 7k3p 9qxm")).toBe("ONC-7K3P-9QXM");
    expect(canonicalSerial("7K3P9QXM")).toBe("ONC-7K3P-9QXM");
    expect(canonicalSerial("0NC-7K3P-9QXM")).toBe("ONC-7K3P-9QXM");
    expect(canonicalSerial("ONC-7K3P-9QX0")).toBe(canonicalSerial("ONC-7K3P-9QXO")); // O typed for 0
  });

  it("rejects malformed input", () => {
    expect(canonicalSerial("ONC-7K3P")).toBeNull();
    expect(canonicalSerial("")).toBeNull();
  });
});

describe("hidden codes", () => {
  it("round-trips through what people type", () => {
    const code = generateHiddenCode();
    expect(canonicalHiddenCode(code.toLowerCase().replace("-", " "))).toBe(code);
  });

  it("maps I/L to 1 and O to 0", () => {
    expect(canonicalHiddenCode("FGOI-BBCX")).toBe("FG01-BBCX");
    expect(canonicalHiddenCode("FGOL-BBCX")).toBe("FG01-BBCX");
  });
});

describe("encryption of hidden codes", () => {
  it("decrypts what it encrypts, with a fresh IV each time", () => {
    const a = encrypt("4QZ7-M2KD");
    const b = encrypt("4QZ7-M2KD");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("4QZ7-M2KD");
  });

  it("detects tampering", () => {
    const [iv, tag, enc] = encrypt("4QZ7-M2KD").split(".");
    expect(() => decrypt([iv, tag, enc.slice(0, -2) + "AA"].join("."))).toThrow();
  });
});

describe("helpers", () => {
  it("masks the invited email", () => {
    expect(maskEmail("anna@gmail.com")).toBe("a•••@gmail.com");
  });

  it("only allows in-app return paths after login", () => {
    expect(safeNext("/claim")).toBe("/claim");
    expect(safeNext("/accept/abc_DEF-123")).toBe("/accept/abc_DEF-123");
    expect(safeNext("//evil.com")).toBe("/my-bottles");
    expect(safeNext("https://evil.com")).toBe("/my-bottles");
    expect(safeNext("/admin")).toBe("/my-bottles");
  });
});
