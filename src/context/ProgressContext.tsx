import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Progress, PracticeSession, RandomPracticeSession, Screen, Question, TableStats } from "../types";
import { loadProgress, saveProgress } from "../domain/persistence";
import { evaluateAnswer } from "../domain/evaluation";
import { shouldUnlockNext, getNextTableToUnlock } from "../domain/unlock";
import { generateSessionQuestions, getNextQuestion, generateRandomSessionQuestions, getNextRandomQuestion } from "../domain/questions";
import { calculateMasteryLevel } from "../domain/stats";

interface ProgressContextValue {
  progress: Progress;
  session: PracticeSession | null;
  randomSession: RandomPracticeSession | null;
  screen: Screen;
  unlockCelebration: number | null; // tableNumber that was just unlocked, or null
  submitAnswer: (tableNumber: number, answer: number, question: Question, skipUnlock?: boolean) => void;
  startSession: (tableNumber: number) => void;
  startRandomSession: () => void;
  advanceSession: () => void;
  advanceRandomSession: () => void;
  navigateTo: (screen: Screen) => void;
  dismissCelebration: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [randomSession, setRandomSession] = useState<RandomPracticeSession | null>(null);
  const [screen, setScreen] = useState<Screen>({ type: "selection" });
  const [unlockCelebration, setUnlockCelebration] = useState<number | null>(null);

  const submitAnswer = useCallback(
    (tableNumber: number, answer: number, question: Question, skipUnlock?: boolean) => {
      const isCorrect = evaluateAnswer(question, answer);

      setProgress((prev) => {
        // Get or create table stats
        const currentStats: TableStats = prev.tableStats[tableNumber] ?? {
          tableNumber,
          totalAnswered: 0,
          totalCorrect: 0,
          masteryLevel: 0,
        };

        const newTotalAnswered = currentStats.totalAnswered + 1;
        const newTotalCorrect = currentStats.totalCorrect + (isCorrect ? 1 : 0);
        const newMasteryLevel = calculateMasteryLevel(newTotalCorrect, newTotalAnswered);

        const updatedTableStats: TableStats = {
          tableNumber,
          totalAnswered: newTotalAnswered,
          totalCorrect: newTotalCorrect,
          masteryLevel: newMasteryLevel,
        };

        // Check for unlock (skip in random mode)
        let newUnlockedTables = prev.unlockedTables;
        if (!skipUnlock && shouldUnlockNext(updatedTableStats)) {
          const nextTable = getNextTableToUnlock(prev.unlockedTables);
          if (nextTable !== null && !prev.unlockedTables.includes(nextTable)) {
            newUnlockedTables = [...prev.unlockedTables, nextTable];
            setUnlockCelebration(nextTable);
          }
        }

        const updatedProgress: Progress = {
          unlockedTables: newUnlockedTables,
          tableStats: {
            ...prev.tableStats,
            [tableNumber]: updatedTableStats,
          },
          totalAnswered: prev.totalAnswered + 1,
          totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
          randomStats: skipUnlock
            ? {
                totalAnswered: prev.randomStats.totalAnswered + 1,
                totalCorrect: prev.randomStats.totalCorrect + (isCorrect ? 1 : 0),
              }
            : prev.randomStats,
        };

        saveProgress(updatedProgress);
        return updatedProgress;
      });
    },
    []
  );

  const startSession = useCallback((tableNumber: number) => {
    const questions = generateSessionQuestions(tableNumber);
    setSession({
      tableNumber,
      questions,
      currentIndex: 0,
      feedbackState: { type: "none" },
    });
    setScreen({ type: "practice", tableNumber });
  }, []);

  const startRandomSession = useCallback(() => {
    const questions = generateRandomSessionQuestions();
    setRandomSession({
      tableNumber: questions[0].factorA,
      questions,
      currentIndex: 0,
      feedbackState: { type: "none" },
      isRandom: true,
    });
    setScreen({ type: "random-practice" });
  }, []);

  const navigateTo = useCallback((newScreen: Screen) => {
    setScreen(newScreen);
    if (newScreen.type !== "practice") {
      setSession(null);
    }
    if (newScreen.type !== "random-practice") {
      setRandomSession(null);
    }
  }, []);

  const advanceSession = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const result = getNextQuestion(prev);
      if (!result) return prev;
      return result.updatedSession;
    });
  }, []);

  const advanceRandomSession = useCallback(() => {
    setRandomSession((prev) => {
      if (!prev) return prev;
      const result = getNextRandomQuestion(prev);
      if (!result) return prev;
      return result.updatedSession;
    });
  }, []);

  const dismissCelebration = useCallback(() => {
    setUnlockCelebration(null);
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        session,
        randomSession,
        screen,
        unlockCelebration,
        submitAnswer,
        startSession,
        startRandomSession,
        advanceSession,
        advanceRandomSession,
        navigateTo,
        dismissCelebration,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (context === null) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
}
