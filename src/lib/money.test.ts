import { expect, test, describe } from "bun:test";
import { toMinorUnits, minorUnitsToDisplay, getCurrencySymbol } from "./money";

describe("Money Utilities", () => {
  describe("toMinorUnits", () => {
    test("converts simple decimals", () => {
      expect(toMinorUnits("123.45")).toBe(12345);
      expect(toMinorUnits(123.45)).toBe(12345);
    });

    test("handles whole numbers", () => {
      expect(toMinorUnits("123")).toBe(12300);
      expect(toMinorUnits(123)).toBe(12300);
    });

    test("handles edge cases and floating point issues", () => {
      expect(toMinorUnits("0.1")).toBe(10);
      expect(toMinorUnits("0.01")).toBe(1);
      expect(toMinorUnits(0.1 + 0.2)).toBe(30); // 0.30000000000000004 -> 30
    });

    test("handles zero and empty strings", () => {
      expect(toMinorUnits("0")).toBe(0);
      expect(toMinorUnits(0)).toBe(0);
      expect(toMinorUnits("")).toBe(0);
    });

    test("handles malformed input", () => {
      expect(toMinorUnits("abc")).toBe(0);
    });
  });

  describe("minorUnitsToDisplay", () => {
    test("formats correctly", () => {
      expect(minorUnitsToDisplay(12345)).toBe("123.45");
      expect(minorUnitsToDisplay(12300)).toBe("123.00");
      expect(minorUnitsToDisplay(10)).toBe("0.10");
      expect(minorUnitsToDisplay(1)).toBe("0.01");
      expect(minorUnitsToDisplay(0)).toBe("0.00");
    });

    test("handles negative values", () => {
      expect(minorUnitsToDisplay(-12345)).toBe("-123.45");
      expect(minorUnitsToDisplay(-10)).toBe("-0.10");
    });
  });

  describe("getCurrencySymbol", () => {
    test("returns correct symbols", () => {
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("EUR")).toBe("€");
      expect(getCurrencySymbol("GBP")).toBe("£");
      expect(getCurrencySymbol("INR")).toBe("₹");
    });

    test("defaults to INR", () => {
      expect(getCurrencySymbol()).toBe("₹");
      expect(getCurrencySymbol("UNKNOWN")).toBe("₹");
    });

    test("is case insensitive", () => {
      expect(getCurrencySymbol("usd")).toBe("$");
    });
  });
});
