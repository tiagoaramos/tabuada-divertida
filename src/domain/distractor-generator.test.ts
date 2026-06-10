import { generateDistractors } from "./distractor-generator";
import type { CategoryDefinition } from "./category-registry";
import type { Question } from "../types";

const addition: CategoryDefinition = {
  id: "addition",
  label: "Soma",
  operator: "+",
  icon: "addition",
  compute: (a, b) => a + b,
};

const multiplication: CategoryDefinition = {
  id: "multiplication",
  label: "Multiplicação",
  operator: "×",
  icon: "multiplication",
  compute: (a, b) => a * b,
};

describe("generateDistractors", () => {
  it("returns exactly 3 distractors", () => {
    const question: Question = { factorA: 5, factorB: 5, correctAnswer: 10 };
    const result = generateDistractors(question, addition);
    expect(result).toHaveLength(3);
  });

  it("all distractors are distinct from correctAnswer", () => {
    const question: Question = { factorA: 5, factorB: 5, correctAnswer: 10 };
    const result = generateDistractors(question, addition);
    for (const d of result) {
      expect(d).not.toBe(question.correctAnswer);
    }
  });

  it("all distractors are distinct from each other", () => {
    const question: Question = { factorA: 5, factorB: 5, correctAnswer: 10 };
    const result = generateDistractors(question, addition);
    const unique = new Set(result);
    expect(unique.size).toBe(3);
  });

  it("all distractors are >= 1", () => {
    const question: Question = { factorA: 2, factorB: 1, correctAnswer: 3 };
    const result = generateDistractors(question, addition);
    for (const d of result) {
      expect(d).toBeGreaterThanOrEqual(1);
    }
  });

  it("works for multiplication category", () => {
    const question: Question = { factorA: 7, factorB: 6, correctAnswer: 42 };
    const result = generateDistractors(question, multiplication);
    expect(result).toHaveLength(3);
    for (const d of result) {
      expect(d).not.toBe(42);
      expect(d).toBeGreaterThanOrEqual(1);
    }
    const unique = new Set(result);
    expect(unique.size).toBe(3);
  });

  it("uses fallback when factorB is at boundary (factorB=1)", () => {
    // With factorB=1, only offsets +1, +2, +3 are valid (factorB+offset in [1,10])
    // For addition with factorA=2: compute(2,2)=4, compute(2,3)=5, compute(2,4)=6
    // correctAnswer = 3, so candidates: 4, 5, 6 — enough for primary strategy
    const question: Question = { factorA: 2, factorB: 1, correctAnswer: 3 };
    const result = generateDistractors(question, addition);
    expect(result).toHaveLength(3);
    const unique = new Set(result);
    expect(unique.size).toBe(3);
  });

  it("uses fallback when factorB is at boundary (factorB=10)", () => {
    // With factorB=10, only offsets -1, -2, -3 are valid
    // For addition with factorA=2: compute(2,7)=9, compute(2,8)=10, compute(2,9)=11
    // correctAnswer = 12, so candidates: 9, 10, 11 — enough for primary strategy
    const question: Question = { factorA: 2, factorB: 10, correctAnswer: 12 };
    const result = generateDistractors(question, addition);
    expect(result).toHaveLength(3);
    for (const d of result) {
      expect(d).not.toBe(12);
      expect(d).toBeGreaterThanOrEqual(1);
    }
  });

  it("handles edge case where primary strategy yields fewer than 3 candidates", () => {
    // Custom category that always returns the same value for any input
    // This forces the fallback path
    const constCategory: CategoryDefinition = {
      id: "const",
      label: "Constante",
      operator: "=",
      icon: "const",
      compute: () => 5,
    };
    const question: Question = { factorA: 3, factorB: 5, correctAnswer: 5 };
    const result = generateDistractors(question, constCategory);
    expect(result).toHaveLength(3);
    for (const d of result) {
      expect(d).not.toBe(5);
      expect(d).toBeGreaterThanOrEqual(1);
    }
    const unique = new Set(result);
    expect(unique.size).toBe(3);
  });

  it("distractors are integers", () => {
    const question: Question = { factorA: 4, factorB: 3, correctAnswer: 7 };
    const result = generateDistractors(question, addition);
    for (const d of result) {
      expect(Number.isInteger(d)).toBe(true);
    }
  });
});
