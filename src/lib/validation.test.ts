import { expect, test, describe } from "bun:test";
import { isValidUUID } from "./validation";

describe("Validation Utilities", () => {
  describe("isValidUUID", () => {
    test("returns true for valid UUIDs", () => {
      expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isValidUUID("00000000-0000-0000-0000-000000000000")).toBe(true);
      expect(isValidUUID("ffffffff-ffff-ffff-ffff-ffffffffffff")).toBe(true);
    });

    test("returns false for invalid UUIDs", () => {
      expect(isValidUUID("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // Too short
      expect(isValidUUID("123e4567-e89b-12d3-a456-4266141740000")).toBe(false); // Too long
      expect(isValidUUID("123e4567-e89b-12d3-a456-42661417400g")).toBe(false); // Invalid character
      expect(isValidUUID("123e4567e89b12d3a456426614174000")).toBe(false); // Missing dashes
      expect(isValidUUID("")).toBe(false); // Empty
      expect(isValidUUID("not-a-uuid")).toBe(false);
    });

    test("returns false for non-string inputs", () => {
      // @ts-expect-error Testing invalid types
      expect(isValidUUID(null)).toBe(false);
      // @ts-expect-error Testing invalid types
      expect(isValidUUID(undefined)).toBe(false);
      // @ts-expect-error Testing invalid types
      expect(isValidUUID(123)).toBe(false);
    });
  });
});
