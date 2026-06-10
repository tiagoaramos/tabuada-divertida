import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Progress, PracticeSession, RandomPracticeSession, Screen, Question, TableStats, Student } from "../types";
import { loadProgress, saveProgress, loadStudents, saveStudents, loadActiveStudent, saveActiveStudent, generateStudentId, getDefaultProgress } from "../domain/persistence";
import { evaluateAnswer } from "../domain/evaluation";
import { shouldUnlockNext, getNextTableToUnlock } from "../domain/unlock";
import { generateSessionQuestions, getNextQuestion, generateRandomSessionQuestions, getNextRandomQuestion } from "../domain/questions";
import { calculateMasteryLevel } from "../domain/stats";

interface ProgressContextValue {
  progress: Progress;
  session: PracticeSession | null;
  randomSession: RandomPracticeSession | null;
  screen: Screen;
  unlockCelebration: number | null;
  currentStudent: Student | null;
  students: Student[];
  submitAnswer: (tableNumber: number, answer: number, question: Question, skipUnlock?: boolean) => void;
  startSession: (tableNumber: number) => void;
  startRandomSession: () => void;
  advanceSession: () => void;
  advanceRandomSession: () => void;
  navigateTo: (screen: Screen) => void;
  dismissCelebration: () => void;
  selectStudent: (student: Student) => void;
  createStudent: (name: string) => void;
  deleteStudent: (studentId: string) => void;
  logout: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const activeId = loadActiveStudent();
    if (!activeId) return null;
    const allStudents = loadStudents();
    return allStudents.find((s) => s.id === activeId) ?? null;
  });

  const [progress, setProgress] = useState<Progress>(() => {
    const activeId = loadActiveStudent();
    if (activeId) return loadProgress(activeId);
    return getDefaultProgress();
  });

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [randomSession, setRandomSession] = useState<RandomPracticeSession | null>(null);
  const [screen, setScreen] = useState<Screen>(() => {
    const activeId = loadActiveStudent();
    if (activeId) {
      const allStudents = loadStudents();
      const found = allStudents.find((s) => s.id === activeId);
      if (found) return { type: "selection" };
    }
    return { type: "student-select" };
  });
  const [unlockCelebration, setUnlockCelebration] = useState<number | null>(null);

  const selectStudent = useCallback((student: Student) => {
    setCurrentStudent(student);
    saveActiveStudent(student.id);
    const studentProgress = loadProgress(student.id);
    setProgress(studentProgress);
    setScreen({ type: "selection" });
    setSession(null);
    setRandomSession(null);
  }, []);

  const createStudent = useCallback((name: string) => {
    const newStudent: Student = {
      id: generateStudentId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedStudents = [...loadStudents(), newStudent];
    saveStudents(updatedStudents);
    setStudents(updatedStudents);
    selectStudent(newStudent);
  }, [selectStudent]);

  const deleteStudent = useCallback((studentId: string) => {
    const updatedStudents = loadStudents().filter((s) => s.id !== studentId);
    saveStudents(updatedStudents);
    setStudents(updatedStudents);
    // Se deletou o aluno ativo, volta para tela de seleção de aluno
    if (currentStudent?.id === studentId) {
      setCurrentStudent(null);
      setProgress(getDefaultProgress());
      setScreen({ type: "student-select" });
      localStorage.removeItem("math-trainer-active-student");
    }
  }, [currentStudent]);

  const logout = useCallback(() => {
    setCurrentStudent(null);
    setProgress(getDefaultProgress());
    setSession(null);
    setRandomSession(null);
    setScreen({ type: "student-select" });
    localStorage.removeItem("math-trainer-active-student");
  }, []);

  const submitAnswer = useCallback(
    (tableNumber: number, answer: number, question: Question, skipUnlock?: boolean) => {
      const isCorrect = evaluateAnswer(question, answer);

      setProgress((prev) => {
        if (skipUnlock) {
          const updatedProgress: Progress = {
            ...prev,
            totalAnswered: prev.totalAnswered + 1,
            totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
            randomStats: {
              totalAnswered: prev.randomStats.totalAnswered + 1,
              totalCorrect: prev.randomStats.totalCorrect + (isCorrect ? 1 : 0),
            },
          };
          const activeId = loadActiveStudent();
          saveProgress(updatedProgress, activeId ?? undefined);
          return updatedProgress;
        }

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

        let newUnlockedTables = prev.unlockedTables;
        if (shouldUnlockNext(updatedTableStats)) {
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
          randomStats: prev.randomStats,
        };

        const activeId = loadActiveStudent();
        saveProgress(updatedProgress, activeId ?? undefined);
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
        currentStudent,
        students,
        submitAnswer,
        startSession,
        startRandomSession,
        advanceSession,
        advanceRandomSession,
        navigateTo,
        dismissCelebration,
        selectStudent,
        createStudent,
        deleteStudent,
        logout,
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
