import type { Question } from "../types";
import type { CategoryDefinition } from "./category-registry";

/**
 * Generates exactly 3 plausible distractors for a multiple-choice question.
 *
 * Primary strategy: compute category.compute(factorA, factorB + offset) for
 * offsets [-3, -2, -1, +1, +2, +3] where factorB + offset is in [1, 10].
 *
 * Fallback: use correctAnswer ± offsets [-2, -1, +1, +2], filter out
 * correctAnswer and values < 1, then select 3.
 */
export function generateDistractors(
  question: Question,
  category: CategoryDefinition
): [number, number, number] {
  const { factorA, factorB, correctAnswer } = question;
  const offsets = [-3, -2, -1, 1, 2, 3];

  // Primary strategy: nearby operations
  const candidateSet = new Set<number>();

  for (const offset of offsets) {
    const adjustedB = factorB + offset;
    if (adjustedB >= 1 && adjustedB <= 10) {
      const value = category.compute(factorA, adjustedB);
      if (value >= 1 && value !== correctAnswer) {
        candidateSet.add(value);
      }
    }
  }

  const candidates = Array.from(candidateSet);

  if (candidates.length >= 3) {
    // Select 3 at random using Fisher-Yates partial shuffle
    const selected = selectRandom(candidates, 3);
    return selected as [number, number, number];
  }

  // Fallback: correctAnswer ± offsets
  const fallbackOffsets = [-2, -1, 1, 2];
  const fallbackSet = new Set<number>();

  for (const offset of fallbackOffsets) {
    const value = correctAnswer + offset;
    if (value >= 1 && value !== correctAnswer) {
      fallbackSet.add(value);
    }
  }

  const fallbackCandidates = Array.from(fallbackSet);
  const selected = selectRandom(fallbackCandidates, 3);
  return selected as [number, number, number];
}

/**
 * Selects `count` random elements from an array without replacement.
 * Uses Fisher-Yates partial shuffle for unbiased selection.
 */
function selectRandom(arr: number[], count: number): number[] {
  const copy = [...arr];
  const result: number[] = [];

  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy[idx]);
    copy[idx] = copy[copy.length - 1];
    copy.pop();
  }

  return result;
}
