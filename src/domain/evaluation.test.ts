import { describe, it, expect } from "vitest";
import { evaluateAnswer } from "./evaluation";
import type { Question } from "../types";

describe("evaluateAnswer", () => {
  it("returns true when userAnswer matches correctAnswer", () => {
    const question: Question = { factorA: 3, factorB: 4, correctAnswer: 12 };
    expect(evaluateAnswer(question, 12)).toBe(true);
  });

  it("returns false when userAnswer does not match correctAnswer", () => {
    const question: Question = { factorA: 3, factorB: 4, correctAnswer: 12 };
    expect(evaluateAnswer(question, 11)).toBe(false);
  });

  it("returns false for zero as answer when incorrect", () => {
    const question: Question = { factorA: 5, factorB: 5, correctAnswer: 25 };
    expect(evaluateAnswer(question, 0)).toBe(false);
  });

  it("handles boundary values (tabuada do 2, fator 1)", () => {
    const question: Question = { factorA: 2, factorB: 1, correctAnswer: 2 };
    expect(evaluateAnswer(question, 2)).toBe(true);
  });

  it("handles boundary values (tabuada do 10, fator 10)", () => {
    const question: Question = { factorA: 10, factorB: 10, correctAnswer: 100 };
    expect(evaluateAnswer(question, 100)).toBe(true);
  });
});
