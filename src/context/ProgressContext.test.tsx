import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ProgressProvider, useProgress } from "./ProgressContext";
import type { ReactNode } from "react";
import { STUDENTS_KEY, ACTIVE_STUDENT_KEY, getStudentStorageKey } from "../domain/persistence";

function wrapper({ children }: { children: ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}

/**
 * Configura um aluno ativo no localStorage para testes que precisam
 * de um aluno logado.
 */
function setupActiveStudent(studentId = "test-student-1") {
  const students = [{ id: studentId, name: "Aluno Teste", createdAt: "2025-01-01T00:00:00.000Z" }];
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  localStorage.setItem(ACTIVE_STUDENT_KEY, studentId);
  return studentId;
}

describe("ProgressContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("initial state", () => {
    it("shows student-select screen when no active student", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });

      expect(result.current.progress).toEqual({
        unlockedTables: [2],
        tableStats: {},
        totalAnswered: 0,
        totalCorrect: 0,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      });
      expect(result.current.session).toBeNull();
      expect(result.current.screen).toEqual({ type: "student-select" });
      expect(result.current.unlockCelebration).toBeNull();
    });

    it("loads default progress when active student has no saved data", () => {
      setupActiveStudent();
      const { result } = renderHook(() => useProgress(), { wrapper });

      expect(result.current.progress).toEqual({
        unlockedTables: [2],
        tableStats: {},
        totalAnswered: 0,
        totalCorrect: 0,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      });
      expect(result.current.screen).toEqual({ type: "selection" });
    });

    it("loads saved progress from localStorage for active student", () => {
      const studentId = setupActiveStudent();
      const stored = {
        version: 1,
        unlockedTables: [2, 3],
        tableStats: {
          "2": { totalAnswered: 15, totalCorrect: 13 },
        },
      };
      localStorage.setItem(getStudentStorageKey(studentId), JSON.stringify(stored));

      const { result } = renderHook(() => useProgress(), { wrapper });

      expect(result.current.progress.unlockedTables).toEqual([2, 3]);
      expect(result.current.progress.tableStats[2].totalAnswered).toBe(15);
      expect(result.current.progress.tableStats[2].totalCorrect).toBe(13);
    });
  });

  describe("submitAnswer", () => {
    it("updates stats on correct answer", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });
      const question = { factorA: 2, factorB: 3, correctAnswer: 6 };

      act(() => {
        result.current.submitAnswer(2, 6, question);
      });

      expect(result.current.progress.totalAnswered).toBe(1);
      expect(result.current.progress.totalCorrect).toBe(1);
      expect(result.current.progress.tableStats[2].totalAnswered).toBe(1);
      expect(result.current.progress.tableStats[2].totalCorrect).toBe(1);
      expect(result.current.progress.tableStats[2].masteryLevel).toBe(100);
    });

    it("updates stats on incorrect answer", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });
      const question = { factorA: 2, factorB: 3, correctAnswer: 6 };

      act(() => {
        result.current.submitAnswer(2, 7, question);
      });

      expect(result.current.progress.totalAnswered).toBe(1);
      expect(result.current.progress.totalCorrect).toBe(0);
      expect(result.current.progress.tableStats[2].totalCorrect).toBe(0);
      expect(result.current.progress.tableStats[2].masteryLevel).toBe(0);
    });

    it("persists progress to localStorage after each answer", () => {
      const studentId = setupActiveStudent();
      const { result } = renderHook(() => useProgress(), { wrapper });
      const question = { factorA: 2, factorB: 5, correctAnswer: 10 };

      act(() => {
        result.current.submitAnswer(2, 10, question);
      });

      const stored = JSON.parse(localStorage.getItem(getStudentStorageKey(studentId))!);
      expect(stored.version).toBe(1);
      expect(stored.tableStats["2"].totalAnswered).toBe(1);
      expect(stored.tableStats["2"].totalCorrect).toBe(1);
    });

    it("triggers unlock celebration when mastery threshold is met", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });
      const question = { factorA: 2, factorB: 5, correctAnswer: 10 };

      // Submit 10 correct answers to reach unlock threshold (80% with 10+ answers)
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.submitAnswer(2, 10, question);
        }
      });

      expect(result.current.progress.unlockedTables).toContain(3);
      expect(result.current.unlockCelebration).toBe(3);
    });

    it("does not unlock if mastery is below threshold", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });
      const question = { factorA: 2, factorB: 5, correctAnswer: 10 };

      // Submit 10 answers: 7 correct, 3 wrong → 70% < 80%
      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current.submitAnswer(2, 10, question);
        }
        for (let i = 0; i < 3; i++) {
          result.current.submitAnswer(2, 99, question);
        }
      });

      expect(result.current.progress.unlockedTables).toEqual([2]);
      expect(result.current.unlockCelebration).toBeNull();
    });
  });

  describe("startSession", () => {
    it("creates a practice session and navigates to practice screen", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });

      act(() => {
        result.current.startSession(5);
      });

      expect(result.current.session).not.toBeNull();
      expect(result.current.session!.tableNumber).toBe(5);
      expect(result.current.session!.questions).toHaveLength(10);
      expect(result.current.session!.currentIndex).toBe(0);
      expect(result.current.session!.feedbackState).toEqual({ type: "none" });
      expect(result.current.screen).toEqual({ type: "practice", tableNumber: 5 });
    });

    it("generates questions with correct factorA", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });

      act(() => {
        result.current.startSession(7);
      });

      for (const q of result.current.session!.questions) {
        expect(q.factorA).toBe(7);
        expect(q.factorB).toBeGreaterThanOrEqual(1);
        expect(q.factorB).toBeLessThanOrEqual(10);
        expect(q.correctAnswer).toBe(q.factorA * q.factorB);
      }
    });
  });

  describe("navigateTo", () => {
    it("changes the current screen", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });

      act(() => {
        result.current.navigateTo({ type: "stats" });
      });

      expect(result.current.screen).toEqual({ type: "stats" });
    });

    it("clears session when navigating away from practice", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });

      act(() => {
        result.current.startSession(3);
      });

      expect(result.current.session).not.toBeNull();

      act(() => {
        result.current.navigateTo({ type: "selection" });
      });

      expect(result.current.session).toBeNull();
    });
  });

  describe("dismissCelebration", () => {
    it("clears the unlock celebration state", () => {
      const { result } = renderHook(() => useProgress(), { wrapper });
      const question = { factorA: 2, factorB: 5, correctAnswer: 10 };

      // Trigger unlock
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.submitAnswer(2, 10, question);
        }
      });

      expect(result.current.unlockCelebration).toBe(3);

      act(() => {
        result.current.dismissCelebration();
      });

      expect(result.current.unlockCelebration).toBeNull();
    });
  });

  describe("useProgress hook", () => {
    it("throws error when used outside provider", () => {
      expect(() => {
        renderHook(() => useProgress());
      }).toThrow("useProgress must be used within a ProgressProvider");
    });
  });
});
