import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatElapsedTime } from "./useSessionTimer";

/**
 * Property 1: Time formatting correctness
 * Validates: Requirements 1.4, 2.1, 2.2, 2.3, 2.4
 */
describe("formatElapsedTime - Property Tests", () => {
  it("should format any non-negative integer as MM:SS correctly", () => {
    fc.assert(
      fc.property(fc.nat(), (n) => {
        const expected =
          String(Math.floor(n / 60)).padStart(2, "0") +
          ":" +
          String(n % 60).padStart(2, "0");
        expect(formatElapsedTime(n)).toBe(expected);
      })
    );
  });
});
