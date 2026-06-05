import { describe, it, expect } from "vitest";
import { calculateMasteryLevel, calculateOverallStats } from "./stats";
import type { Progress } from "../types";

describe("calculateMasteryLevel", () => {
  it("returns 0 when no questions answered", () => {
    expect(calculateMasteryLevel(0, 0)).toBe(0);
  });

  it("returns 100 when all answers correct", () => {
    expect(calculateMasteryLevel(10, 10)).toBe(100);
  });

  it("returns correct percentage rounded", () => {
    expect(calculateMasteryLevel(7, 10)).toBe(70);
    expect(calculateMasteryLevel(1, 3)).toBe(33);
    expect(calculateMasteryLevel(2, 3)).toBe(67);
  });

  it("handles single answer", () => {
    expect(calculateMasteryLevel(1, 1)).toBe(100);
    expect(calculateMasteryLevel(0, 1)).toBe(0);
  });
});

describe("calculateOverallStats", () => {
  it("returns zeros for empty progress", () => {
    const progress: Progress = {
      unlockedTables: [2],
      tableStats: {},
      totalAnswered: 0,
      totalCorrect: 0,
    };

    const result = calculateOverallStats(progress);

    expect(result.totalAnswered).toBe(0);
    expect(result.totalCorrect).toBe(0);
    expect(result.overallPercentage).toBe(0);
  });

  it("calculates correct overall stats from progress", () => {
    const progress: Progress = {
      unlockedTables: [2, 3],
      tableStats: {
        2: { tableNumber: 2, totalAnswered: 10, totalCorrect: 8, masteryLevel: 80 },
        3: { tableNumber: 3, totalAnswered: 5, totalCorrect: 3, masteryLevel: 60 },
      },
      totalAnswered: 15,
      totalCorrect: 11,
    };

    const result = calculateOverallStats(progress);

    expect(result.totalAnswered).toBe(15);
    expect(result.totalCorrect).toBe(11);
    expect(result.overallPercentage).toBe(73);
  });
});
