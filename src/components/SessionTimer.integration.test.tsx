import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PracticeScreen } from "./PracticeScreen";
import { RandomPracticeScreen } from "./RandomPracticeScreen";
import type { PracticeSession, RandomPracticeSession, Question } from "../types";

/**
 * Validates: Requirements 3.1, 4.1, 5.1, 5.2
 */

const mockQuestion: Question = {
  factorA: 3,
  factorB: 4,
  correctAnswer: 12,
};

const mockSession: PracticeSession = {
  tableNumber: 3,
  questions: [mockQuestion, { factorA: 3, factorB: 5, correctAnswer: 15 }],
  currentIndex: 1,
  feedbackState: { type: "none" },
};

const mockRandomSession: RandomPracticeSession = {
  tableNumber: 3,
  questions: [mockQuestion, { factorA: 5, factorB: 6, correctAnswer: 30 }],
  currentIndex: 1,
  feedbackState: { type: "none" },
  isRandom: true,
};

const mockSubmitAnswer = vi.fn();
const mockAdvanceSession = vi.fn();
const mockAdvanceRandomSession = vi.fn();

vi.mock("../context/ProgressContext", () => ({
  useProgress: () => ({
    session: mockSession,
    randomSession: mockRandomSession,
    submitAnswer: mockSubmitAnswer,
    advanceSession: mockAdvanceSession,
    advanceRandomSession: mockAdvanceRandomSession,
    progress: { unlockedTables: [2, 3], tableStats: {}, totalAnswered: 0, totalCorrect: 0, randomStats: { totalAnswered: 0, totalCorrect: 0 } },
    screen: { type: "practice", tableNumber: 3 },
    unlockCelebration: null,
    startSession: vi.fn(),
    startRandomSession: vi.fn(),
    navigateTo: vi.fn(),
    dismissCelebration: vi.fn(),
    categoryId: "multiplication",
    questionTypeId: "open",
  }),
}));

vi.mock("../domain/response-times", () => ({
  createResponseTimeRecord: vi.fn(() => ({})),
  saveResponseTimeRecord: vi.fn(),
}));

describe("SessionTimer integration with PracticeScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a timer element with role='timer'", () => {
    render(<PracticeScreen tableNumber={3} />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("timer starts at '00:00' on mount", () => {
    render(<PracticeScreen tableNumber={3} />);
    const timer = screen.getByRole("timer");
    expect(timer).toHaveTextContent("00:00");
  });

  it("timer continues incrementing during feedback overlay display", () => {
    render(<PracticeScreen tableNumber={3} />);

    // Advance 3 seconds - timer should be at 00:03
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");

    // Simulate showing feedback by submitting an answer
    const input = screen.getByRole("spinbutton");
    const form = input.closest("form")!;
    act(() => {
      input.focus();
      (input as HTMLInputElement).value = "12";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    // Timer should keep incrementing even with feedback overlay showing
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:05");
  });
});

describe("SessionTimer integration with RandomPracticeScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a timer element with role='timer'", () => {
    render(<RandomPracticeScreen />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("timer starts at '00:00' on mount", () => {
    render(<RandomPracticeScreen />);
    const timer = screen.getByRole("timer");
    expect(timer).toHaveTextContent("00:00");
  });

  it("timer continues incrementing during feedback overlay display", () => {
    render(<RandomPracticeScreen />);

    // Advance 3 seconds - timer should be at 00:03
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");

    // Simulate showing feedback by submitting an answer
    const input = screen.getByRole("spinbutton");
    const form = input.closest("form")!;
    act(() => {
      input.focus();
      (input as HTMLInputElement).value = "12";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true }));
    });

    // Timer should keep incrementing even with feedback overlay showing
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:05");
  });
});
