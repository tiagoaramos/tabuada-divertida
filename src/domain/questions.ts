import type { Question, PracticeSession, RandomPracticeSession } from "../types";

/** Tables allowed in random mode (excludes 0, 1, 2, and 10) */
const RANDOM_MODE_TABLES = [3, 4, 5, 6, 7, 8, 9];

/**
 * Fisher-Yates shuffle algorithm.
 * Returns a new shuffled array without mutating the original.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a shuffled cycle of 10 questions for the given table number.
 * Each cycle contains exactly factors 1-10 in random order.
 */
export function generateSessionQuestions(tableNumber: number): Question[] {
  const factors = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  return factors.map((b) => ({
    factorA: tableNumber,
    factorB: b,
    correctAnswer: tableNumber * b,
  }));
}

/**
 * Generates a new cycle ensuring the first question differs from the last
 * question of the previous cycle (no consecutive repetition between cycles).
 */
function generateNonRepeatingCycle(
  tableNumber: number,
  lastQuestion: Question
): Question[] {
  let questions = generateSessionQuestions(tableNumber);

  // Keep regenerating until first question of new cycle differs from last of previous
  // In worst case, we swap the first element with another position
  if (
    questions[0].factorB === lastQuestion.factorB &&
    questions.length > 1
  ) {
    // Swap position 0 with a random position from 1..length-1
    const swapIndex = 1 + Math.floor(Math.random() * (questions.length - 1));
    [questions[0], questions[swapIndex]] = [questions[swapIndex], questions[0]];
  }

  return questions;
}

/**
 * Returns the next question and an updated session state.
 * If the current cycle is exhausted, generates a new cycle avoiding
 * consecutive repetition with the last question of the previous cycle.
 * Returns null only if session has no questions (should not happen in normal use).
 */
export function getNextQuestion(
  session: PracticeSession
): { question: Question; updatedSession: PracticeSession } | null {
  if (session.questions.length === 0) {
    return null;
  }

  // If still within the current cycle
  if (session.currentIndex < session.questions.length) {
    return {
      question: session.questions[session.currentIndex],
      updatedSession: {
        ...session,
        currentIndex: session.currentIndex + 1,
        feedbackState: { type: "none" },
      },
    };
  }

  // Cycle exhausted: generate a new cycle avoiding repetition
  const lastQuestion = session.questions[session.questions.length - 1];
  const newQuestions = generateNonRepeatingCycle(
    session.tableNumber,
    lastQuestion
  );

  return {
    question: newQuestions[0],
    updatedSession: {
      ...session,
      questions: newQuestions,
      currentIndex: 1,
      feedbackState: { type: "none" },
    },
  };
}


/**
 * Generates a shuffled batch of random questions from tables 3-9.
 * Each batch picks 10 questions with random tables and random factors (1-10).
 * Avoids repeating the exact same question consecutively.
 */
export function generateRandomSessionQuestions(): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < 10; i++) {
    const table =
      RANDOM_MODE_TABLES[Math.floor(Math.random() * RANDOM_MODE_TABLES.length)];
    const factor = Math.floor(Math.random() * 10) + 1; // 1-10
    questions.push({
      factorA: table,
      factorB: factor,
      correctAnswer: table * factor,
    });
  }

  return questions;
}

/**
 * Returns the next question for a random practice session.
 * When the cycle is exhausted, generates a new batch avoiding
 * the same question appearing consecutively.
 */
export function getNextRandomQuestion(
  session: RandomPracticeSession
): { question: Question; updatedSession: RandomPracticeSession } | null {
  if (session.questions.length === 0) {
    return null;
  }

  // If still within the current cycle
  if (session.currentIndex < session.questions.length) {
    const question = session.questions[session.currentIndex];
    return {
      question,
      updatedSession: {
        ...session,
        tableNumber: question.factorA,
        currentIndex: session.currentIndex + 1,
        feedbackState: { type: "none" },
      },
    };
  }

  // Cycle exhausted: generate a new batch
  let newQuestions = generateRandomSessionQuestions();
  const lastQuestion = session.questions[session.questions.length - 1];

  // Avoid same question at the boundary
  if (
    newQuestions[0].factorA === lastQuestion.factorA &&
    newQuestions[0].factorB === lastQuestion.factorB &&
    newQuestions.length > 1
  ) {
    const swapIndex = 1 + Math.floor(Math.random() * (newQuestions.length - 1));
    [newQuestions[0], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[0]];
  }

  return {
    question: newQuestions[0],
    updatedSession: {
      ...session,
      tableNumber: newQuestions[0].factorA,
      questions: newQuestions,
      currentIndex: 1,
      feedbackState: { type: "none" },
    },
  };
}
