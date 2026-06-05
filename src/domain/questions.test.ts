import { describe, it, expect } from "vitest";
import {
  shuffleArray,
  generateSessionQuestions,
  getNextQuestion,
} from "./questions";
import type { PracticeSession } from "../types";

describe("shuffleArray", () => {
  it("should return an array with the same elements", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("should not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it("should return an array of the same length", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffleArray(input)).toHaveLength(5);
  });

  it("should handle empty arrays", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("should handle single-element arrays", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe("generateSessionQuestions", () => {
  it("should generate exactly 10 questions", () => {
    const questions = generateSessionQuestions(5);
    expect(questions).toHaveLength(10);
  });

  it("should contain all factors from 1 to 10", () => {
    const questions = generateSessionQuestions(7);
    const factors = questions.map((q) => q.factorB).sort((a, b) => a - b);
    expect(factors).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("should set factorA to the table number for all questions", () => {
    const questions = generateSessionQuestions(3);
    expect(questions.every((q) => q.factorA === 3)).toBe(true);
  });

  it("should compute correctAnswer as factorA * factorB", () => {
    const questions = generateSessionQuestions(6);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA * q.factorB)
    ).toBe(true);
  });
});

describe("getNextQuestion", () => {
  it("should return the current question and advance the index", () => {
    const session: PracticeSession = {
      tableNumber: 5,
      questions: [
        { factorA: 5, factorB: 3, correctAnswer: 15 },
        { factorA: 5, factorB: 7, correctAnswer: 35 },
      ],
      currentIndex: 0,
      feedbackState: { type: "none" },
    };

    const result = getNextQuestion(session);
    expect(result).not.toBeNull();
    expect(result!.question).toEqual({
      factorA: 5,
      factorB: 3,
      correctAnswer: 15,
    });
    expect(result!.updatedSession.currentIndex).toBe(1);
  });

  it("should generate a new cycle when the current one is exhausted", () => {
    const session: PracticeSession = {
      tableNumber: 4,
      questions: [{ factorA: 4, factorB: 8, correctAnswer: 32 }],
      currentIndex: 1, // past the end
      feedbackState: { type: "none" },
    };

    const result = getNextQuestion(session);
    expect(result).not.toBeNull();
    // New cycle should have 10 questions
    expect(result!.updatedSession.questions).toHaveLength(10);
    // First question of new cycle should differ from last of previous
    expect(result!.question.factorB).not.toBe(8);
  });

  it("should return null for an empty questions array", () => {
    const session: PracticeSession = {
      tableNumber: 2,
      questions: [],
      currentIndex: 0,
      feedbackState: { type: "none" },
    };

    expect(getNextQuestion(session)).toBeNull();
  });

  it("should reset feedbackState to none on next question", () => {
    const session: PracticeSession = {
      tableNumber: 3,
      questions: [
        { factorA: 3, factorB: 1, correctAnswer: 3 },
        { factorA: 3, factorB: 2, correctAnswer: 6 },
      ],
      currentIndex: 0,
      feedbackState: { type: "correct" },
    };

    const result = getNextQuestion(session);
    expect(result!.updatedSession.feedbackState).toEqual({ type: "none" });
  });

  it("should ensure no consecutive repetition across cycles", () => {
    // Run multiple times to check consistency
    for (let i = 0; i < 20; i++) {
      const session: PracticeSession = {
        tableNumber: 5,
        questions: [{ factorA: 5, factorB: 6, correctAnswer: 30 }],
        currentIndex: 1,
        feedbackState: { type: "none" },
      };

      const result = getNextQuestion(session);
      expect(result).not.toBeNull();
      expect(result!.question.factorB).not.toBe(6);
    }
  });
});
