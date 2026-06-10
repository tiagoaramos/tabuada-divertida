import { describe, it, expect } from "vitest";
import {
  shuffleArray,
  generateSessionQuestions,
  getNextQuestion,
  generateRandomSessionQuestions,
  getNextRandomQuestion,
} from "./questions";
import type { CategoryDefinition } from "./category-registry";
import type { PracticeSession, RandomPracticeSession } from "../types";

const multiplicationCategory: CategoryDefinition = {
  id: "multiplication",
  label: "Multiplicação",
  operator: "×",
  icon: "multiplication",
  compute: (a, b) => a * b,
};

const additionCategory: CategoryDefinition = {
  id: "addition",
  label: "Soma",
  operator: "+",
  icon: "addition",
  compute: (a, b) => a + b,
};

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
    const questions = generateSessionQuestions(5, multiplicationCategory);
    expect(questions).toHaveLength(10);
  });

  it("should contain all factors from 1 to 10", () => {
    const questions = generateSessionQuestions(7, multiplicationCategory);
    const factors = questions.map((q) => q.factorB).sort((a, b) => a - b);
    expect(factors).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("should set factorA to the table number for all questions", () => {
    const questions = generateSessionQuestions(3, multiplicationCategory);
    expect(questions.every((q) => q.factorA === 3)).toBe(true);
  });

  it("should compute correctAnswer using category.compute for multiplication", () => {
    const questions = generateSessionQuestions(6, multiplicationCategory);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA * q.factorB)
    ).toBe(true);
  });

  it("should compute correctAnswer using category.compute for addition", () => {
    const questions = generateSessionQuestions(6, additionCategory);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA + q.factorB)
    ).toBe(true);
  });

  it("should tag each question with the categoryId", () => {
    const questions = generateSessionQuestions(5, multiplicationCategory);
    expect(questions.every((q) => q.categoryId === "multiplication")).toBe(true);

    const addQuestions = generateSessionQuestions(5, additionCategory);
    expect(addQuestions.every((q) => q.categoryId === "addition")).toBe(true);
  });

  it("should default to multiplication category when no category is provided", () => {
    const questions = generateSessionQuestions(4);
    expect(questions).toHaveLength(10);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA * q.factorB)
    ).toBe(true);
    expect(questions.every((q) => q.categoryId === "multiplication")).toBe(true);
  });
});

describe("getNextQuestion", () => {
  it("should return the current question and advance the index", () => {
    const session: PracticeSession = {
      tableNumber: 5,
      questions: [
        { factorA: 5, factorB: 3, correctAnswer: 15, categoryId: "multiplication" },
        { factorA: 5, factorB: 7, correctAnswer: 35, categoryId: "multiplication" },
      ],
      currentIndex: 0,
      feedbackState: { type: "none" },
    };

    const result = getNextQuestion(session, multiplicationCategory);
    expect(result).not.toBeNull();
    expect(result!.question).toEqual({
      factorA: 5,
      factorB: 3,
      correctAnswer: 15,
      categoryId: "multiplication",
    });
    expect(result!.updatedSession.currentIndex).toBe(1);
  });

  it("should generate a new cycle when the current one is exhausted", () => {
    const session: PracticeSession = {
      tableNumber: 4,
      questions: [{ factorA: 4, factorB: 8, correctAnswer: 32, categoryId: "multiplication" }],
      currentIndex: 1, // past the end
      feedbackState: { type: "none" },
    };

    const result = getNextQuestion(session, multiplicationCategory);
    expect(result).not.toBeNull();
    // New cycle should have 10 questions
    expect(result!.updatedSession.questions).toHaveLength(10);
    // First question of new cycle should differ from last of previous
    expect(result!.question.factorB).not.toBe(8);
  });

  it("should generate a new cycle with addition category", () => {
    const session: PracticeSession = {
      tableNumber: 5,
      questions: [{ factorA: 5, factorB: 3, correctAnswer: 8, categoryId: "addition" }],
      currentIndex: 1,
      feedbackState: { type: "none" },
    };

    const result = getNextQuestion(session, additionCategory);
    expect(result).not.toBeNull();
    expect(result!.updatedSession.questions).toHaveLength(10);
    // All questions should use addition compute
    expect(
      result!.updatedSession.questions.every(
        (q) => q.correctAnswer === q.factorA + q.factorB
      )
    ).toBe(true);
    expect(
      result!.updatedSession.questions.every((q) => q.categoryId === "addition")
    ).toBe(true);
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
        { factorA: 3, factorB: 1, correctAnswer: 3, categoryId: "multiplication" },
        { factorA: 3, factorB: 2, correctAnswer: 6, categoryId: "multiplication" },
      ],
      currentIndex: 0,
      feedbackState: { type: "correct" },
    };

    const result = getNextQuestion(session, multiplicationCategory);
    expect(result!.updatedSession.feedbackState).toEqual({ type: "none" });
  });

  it("should ensure no consecutive repetition across cycles", () => {
    // Run multiple times to check consistency
    for (let i = 0; i < 20; i++) {
      const session: PracticeSession = {
        tableNumber: 5,
        questions: [{ factorA: 5, factorB: 6, correctAnswer: 30, categoryId: "multiplication" }],
        currentIndex: 1,
        feedbackState: { type: "none" },
      };

      const result = getNextQuestion(session, multiplicationCategory);
      expect(result).not.toBeNull();
      expect(result!.question.factorB).not.toBe(6);
    }
  });
});

describe("generateRandomSessionQuestions", () => {
  it("should generate exactly 10 questions", () => {
    const questions = generateRandomSessionQuestions(multiplicationCategory);
    expect(questions).toHaveLength(10);
  });

  it("should have factorA in range [3-9]", () => {
    const questions = generateRandomSessionQuestions(multiplicationCategory);
    expect(questions.every((q) => q.factorA >= 3 && q.factorA <= 9)).toBe(true);
  });

  it("should have factorB in range [1-10]", () => {
    const questions = generateRandomSessionQuestions(multiplicationCategory);
    expect(questions.every((q) => q.factorB >= 1 && q.factorB <= 10)).toBe(true);
  });

  it("should compute correctAnswer using category.compute for multiplication", () => {
    const questions = generateRandomSessionQuestions(multiplicationCategory);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA * q.factorB)
    ).toBe(true);
  });

  it("should compute correctAnswer using category.compute for addition", () => {
    const questions = generateRandomSessionQuestions(additionCategory);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA + q.factorB)
    ).toBe(true);
  });

  it("should tag each question with the categoryId", () => {
    const questions = generateRandomSessionQuestions(multiplicationCategory);
    expect(questions.every((q) => q.categoryId === "multiplication")).toBe(true);

    const addQuestions = generateRandomSessionQuestions(additionCategory);
    expect(addQuestions.every((q) => q.categoryId === "addition")).toBe(true);
  });

  it("should default to multiplication category when no category is provided", () => {
    const questions = generateRandomSessionQuestions();
    expect(questions).toHaveLength(10);
    expect(
      questions.every((q) => q.correctAnswer === q.factorA * q.factorB)
    ).toBe(true);
    expect(questions.every((q) => q.categoryId === "multiplication")).toBe(true);
  });
});

describe("getNextRandomQuestion", () => {
  it("should return the current question and advance the index", () => {
    const session: RandomPracticeSession = {
      tableNumber: 5,
      questions: [
        { factorA: 5, factorB: 3, correctAnswer: 15, categoryId: "multiplication" },
        { factorA: 7, factorB: 4, correctAnswer: 28, categoryId: "multiplication" },
      ],
      currentIndex: 0,
      feedbackState: { type: "none" },
      isRandom: true,
    };

    const result = getNextRandomQuestion(session, multiplicationCategory);
    expect(result).not.toBeNull();
    expect(result!.question.factorA).toBe(5);
    expect(result!.question.factorB).toBe(3);
    expect(result!.updatedSession.currentIndex).toBe(1);
  });

  it("should generate a new batch when exhausted", () => {
    const session: RandomPracticeSession = {
      tableNumber: 5,
      questions: [{ factorA: 5, factorB: 3, correctAnswer: 15, categoryId: "multiplication" }],
      currentIndex: 1,
      feedbackState: { type: "none" },
      isRandom: true,
    };

    const result = getNextRandomQuestion(session, multiplicationCategory);
    expect(result).not.toBeNull();
    expect(result!.updatedSession.questions).toHaveLength(10);
  });

  it("should generate new batch with addition category", () => {
    const session: RandomPracticeSession = {
      tableNumber: 5,
      questions: [{ factorA: 5, factorB: 3, correctAnswer: 8, categoryId: "addition" }],
      currentIndex: 1,
      feedbackState: { type: "none" },
      isRandom: true,
    };

    const result = getNextRandomQuestion(session, additionCategory);
    expect(result).not.toBeNull();
    expect(
      result!.updatedSession.questions.every(
        (q) => q.correctAnswer === q.factorA + q.factorB
      )
    ).toBe(true);
    expect(
      result!.updatedSession.questions.every((q) => q.categoryId === "addition")
    ).toBe(true);
  });

  it("should return null for empty questions array", () => {
    const session: RandomPracticeSession = {
      tableNumber: 3,
      questions: [],
      currentIndex: 0,
      feedbackState: { type: "none" },
      isRandom: true,
    };

    expect(getNextRandomQuestion(session)).toBeNull();
  });
});
