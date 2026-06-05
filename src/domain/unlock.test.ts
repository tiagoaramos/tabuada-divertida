import { describe, it, expect } from "vitest";
import { shouldUnlockNext, getNextTableToUnlock } from "./unlock";
import type { TableStats } from "../types";

describe("shouldUnlockNext", () => {
  it("returns true when totalAnswered >= 10 and masteryLevel >= 80", () => {
    const stats: TableStats = { tableNumber: 2, totalAnswered: 10, totalCorrect: 8, masteryLevel: 80 };
    expect(shouldUnlockNext(stats)).toBe(true);
  });

  it("returns false when totalAnswered < 10 even with high mastery", () => {
    const stats: TableStats = { tableNumber: 2, totalAnswered: 9, totalCorrect: 9, masteryLevel: 100 };
    expect(shouldUnlockNext(stats)).toBe(false);
  });

  it("returns false when masteryLevel < 80 even with enough answers", () => {
    const stats: TableStats = { tableNumber: 2, totalAnswered: 10, totalCorrect: 7, masteryLevel: 70 };
    expect(shouldUnlockNext(stats)).toBe(false);
  });

  it("returns false when both conditions are not met", () => {
    const stats: TableStats = { tableNumber: 2, totalAnswered: 5, totalCorrect: 2, masteryLevel: 40 };
    expect(shouldUnlockNext(stats)).toBe(false);
  });

  it("returns true with mastery exactly at threshold", () => {
    const stats: TableStats = { tableNumber: 3, totalAnswered: 15, totalCorrect: 12, masteryLevel: 80 };
    expect(shouldUnlockNext(stats)).toBe(true);
  });
});

describe("getNextTableToUnlock", () => {
  it("returns next table number when max is less than 10", () => {
    expect(getNextTableToUnlock([2])).toBe(3);
    expect(getNextTableToUnlock([2, 3])).toBe(4);
    expect(getNextTableToUnlock([2, 3, 4, 5])).toBe(6);
  });

  it("returns null when all tables are unlocked (max is 10)", () => {
    expect(getNextTableToUnlock([2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeNull();
  });

  it("returns next based on max value even if array is unordered", () => {
    expect(getNextTableToUnlock([5, 2, 4, 3])).toBe(6);
  });

  it("returns 10 when max unlocked is 9", () => {
    expect(getNextTableToUnlock([2, 3, 4, 5, 6, 7, 8, 9])).toBe(10);
  });
});
