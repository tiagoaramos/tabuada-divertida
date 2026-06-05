import type { Progress } from "../types";

export function calculateMasteryLevel(
  totalCorrect: number,
  totalAnswered: number
): number {
  if (totalAnswered === 0) return 0;
  return Math.round((totalCorrect / totalAnswered) * 100);
}

export function calculateOverallStats(progress: Progress): {
  totalAnswered: number;
  totalCorrect: number;
  overallPercentage: number;
} {
  return {
    totalAnswered: progress.totalAnswered,
    totalCorrect: progress.totalCorrect,
    overallPercentage: calculateMasteryLevel(
      progress.totalCorrect,
      progress.totalAnswered
    ),
  };
}
