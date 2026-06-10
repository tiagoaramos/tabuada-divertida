import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Progress, PracticeSession, RandomPracticeSession, Screen, Question, TableStats, Student, QuestionTypeId } from "../types";
import { loadProgress, saveProgress, loadStudents, saveStudents, loadActiveStudent, saveActiveStudent, generateStudentId, getDefaultProgress, migrateProgressIfNeeded } from "../domain/persistence";
import { evaluateAnswer } from "../domain/evaluation";
import { shouldUnlockNext, getNextTableToUnlock } from "../domain/unlock";
import { generateSessionQuestions, getNextQuestion, generateRandomSessionQuestions, getNextRandomQuestion } from "../domain/questions";
import { calculateMasteryLevel } from "../domain/stats";
import { buildProgressKey, type ProgressKey } from "../domain/progress-key";
import { getCategory, type CategoryDefinition } from "../domain/category-registry";

interface ProgressContextValue {
  progress: Progress;
  session: PracticeSession | null;
  randomSession: RandomPracticeSession | null;
  screen: Screen;
  unlockCelebration: number | null;
  currentStudent: Student | null;
  students: Student[];
  categoryId: string;
  questionTypeId: QuestionTypeId;
  progressKey: ProgressKey;
  submitAnswer: (tableNumber: number, answer: number, question: Question, skipUnlock?: boolean) => void;
  startSession: (tableNumber: number) => void;
  startRandomSession: () => void;
  advanceSession: () => void;
  advanceRandomSession: (category?: CategoryDefinition) => void;
  navigateTo: (screen: Screen) => void;
  dismissCelebration: () => void;
  selectStudent: (student: Student) => void;
  createStudent: (name: string) => void;
  deleteStudent: (studentId: string) => void;
  logout: () => void;
  setCategoryId: (id: string) => void;
  setQuestionTypeId: (id: QuestionTypeId) => void;
  setProgressKey: (categoryId: string, questionTypeId: QuestionTypeId) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const DEFAULT_CATEGORY_ID = "multiplication";
const DEFAULT_QUESTION_TYPE_ID: QuestionTypeId = "open";

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const activeId = loadActiveStudent();
    if (!activeId) return null;
    const allStudents = loadStudents();
    return allStudents.find((s) => s.id === activeId) ?? null;
  });

  const [categoryId, setCategoryIdState] = useState<string>(DEFAULT_CATEGORY_ID);
  const [questionTypeId, setQuestionTypeIdState] = useState<QuestionTypeId>(DEFAULT_QUESTION_TYPE_ID);

  const currentProgressKey = buildProgressKey(categoryId, questionTypeId);

  const [progress, setProgress] = useState<Progress>(() => {
    const activeId = loadActiveStudent();
    if (activeId) {
      migrateProgressIfNeeded(activeId);
      const key = buildProgressKey(DEFAULT_CATEGORY_ID, DEFAULT_QUESTION_TYPE_ID);
      return loadProgress(activeId, key);
    }
    return getDefaultProgress();
  });

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [randomSession, setRandomSession] = useState<RandomPracticeSession | null>(null);
  const [screen, setScreen] = useState<Screen>(() => {
    const activeId = loadActiveStudent();
    if (activeId) {
      const allStudents = loadStudents();
      const found = allStudents.find((s) => s.id === activeId);
      if (found) return { type: "category-select" };
    }
    return { type: "student-select" };
  });
  const [unlockCelebration, setUnlockCelebration] = useState<number | null>(null);

  // Load progress when categoryId or questionTypeId changes
  useEffect(() => {
    const activeId = currentStudent?.id;
    if (activeId) {
      const key = buildProgressKey(categoryId, questionTypeId);
      const loadedProgress = loadProgress(activeId, key);
      setProgress(loadedProgress);
    }
  }, [categoryId, questionTypeId, currentStudent?.id]);

  const setCategoryId = useCallback((id: string) => {
    setCategoryIdState(id);
  }, []);

  const setQuestionTypeId = useCallback((id: QuestionTypeId) => {
    setQuestionTypeIdState(id);
  }, []);

  const setProgressKeyFn = useCallback((newCategoryId: string, newQuestionTypeId: QuestionTypeId) => {
    setCategoryIdState(newCategoryId);
    setQuestionTypeIdState(newQuestionTypeId);
  }, []);

  const selectStudent = useCallback((student: Student) => {
    setCurrentStudent(student);
    saveActiveStudent(student.id);
    migrateProgressIfNeeded(student.id);
    const key = buildProgressKey(categoryId, questionTypeId);
    const studentProgress = loadProgress(student.id, key);
    setProgress(studentProgress);
    setScreen({ type: "category-select" });
    setSession(null);
    setRandomSession(null);
  }, [categoryId, questionTypeId]);

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
          if (activeId) {
            saveProgress(updatedProgress, activeId, currentProgressKey);
          } else {
            saveProgress(updatedProgress);
          }
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
        if (activeId) {
          saveProgress(updatedProgress, activeId, currentProgressKey);
        } else {
          saveProgress(updatedProgress);
        }
        return updatedProgress;
      });
    },
    [currentProgressKey]
  );

  const startSession = useCallback((tableNumber: number) => {
    const category = getCategory(categoryId);
    const questions = generateSessionQuestions(tableNumber, category);
    setSession({
      tableNumber,
      questions,
      currentIndex: 0,
      feedbackState: { type: "none" },
    });
    setScreen({ type: "practice", categoryId, questionTypeId, tableNumber });
  }, [categoryId, questionTypeId]);

  const startRandomSession = useCallback(() => {
    const category = getCategory(categoryId);
    const questions = generateRandomSessionQuestions(category);
    setRandomSession({
      tableNumber: questions[0].factorA,
      questions,
      currentIndex: 0,
      feedbackState: { type: "none" },
      isRandom: true,
    });
    setScreen({ type: "random-practice", categoryId, questionTypeId });
  }, [categoryId, questionTypeId]);

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
    const category = getCategory(categoryId);
    setSession((prev) => {
      if (!prev) return prev;
      const result = getNextQuestion(prev, category);
      if (!result) return prev;
      return result.updatedSession;
    });
  }, [categoryId]);

  const advanceRandomSession = useCallback((category?: CategoryDefinition) => {
    setRandomSession((prev) => {
      if (!prev) return prev;
      const result = getNextRandomQuestion(prev, category);
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
        categoryId,
        questionTypeId,
        progressKey: currentProgressKey,
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
        setCategoryId,
        setQuestionTypeId,
        setProgressKey: setProgressKeyFn,
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
