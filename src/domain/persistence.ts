import type { Progress, StoredProgress, TableStats, Student } from "../types";
import { calculateMasteryLevel } from "./stats";

export const STORAGE_KEY = "math-trainer-progress";
export const STUDENTS_KEY = "math-trainer-students";
export const ACTIVE_STUDENT_KEY = "math-trainer-active-student";

/**
 * Retorna a chave de storage para um aluno específico.
 */
export function getStudentStorageKey(studentId: string): string {
  return `${STORAGE_KEY}-${studentId}`;
}

/**
 * Salva a lista de alunos no localStorage.
 */
export function saveStudents(students: Student[]): void {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

/**
 * Carrega a lista de alunos do localStorage.
 */
export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s: unknown) =>
        s !== null &&
        typeof s === "object" &&
        typeof (s as Record<string, unknown>).id === "string" &&
        typeof (s as Record<string, unknown>).name === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Salva o ID do aluno ativo no localStorage.
 */
export function saveActiveStudent(studentId: string): void {
  localStorage.setItem(ACTIVE_STUDENT_KEY, studentId);
}

/**
 * Carrega o ID do aluno ativo do localStorage.
 */
export function loadActiveStudent(): string | null {
  return localStorage.getItem(ACTIVE_STUDENT_KEY);
}

/**
 * Gera um ID único simples para um aluno.
 */
export function generateStudentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Salva o progresso no localStorage, convertendo Progress → StoredProgress.
 * Apenas totalAnswered e totalCorrect por tabuada são armazenados;
 * masteryLevel é recalculado ao carregar.
 * Se studentId for fornecido, salva no storage individual do aluno.
 */
export function saveProgress(progress: Progress, studentId?: string): void {
  const stored: StoredProgress = {
    version: 1,
    unlockedTables: progress.unlockedTables,
    tableStats: Object.fromEntries(
      Object.entries(progress.tableStats).map(([key, val]) => [
        key,
        { totalAnswered: val.totalAnswered, totalCorrect: val.totalCorrect },
      ])
    ),
    randomStats: progress.randomStats,
  };
  const key = studentId ? getStudentStorageKey(studentId) : STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(stored));
}

/**
 * Carrega o progresso do localStorage.
 * Retorna o estado padrão se dados ausentes, corrompidos ou inválidos.
 * Se studentId for fornecido, carrega do storage individual do aluno.
 */
export function loadProgress(studentId?: string): Progress {
  try {
    const key = studentId ? getStudentStorageKey(studentId) : STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw) as StoredProgress;
    if (!isValidStoredProgress(parsed)) return getDefaultProgress();
    return reconstructProgress(parsed);
  } catch {
    return getDefaultProgress();
  }
}

/**
 * Retorna o estado padrão: apenas tabuada do 2 desbloqueada, sem estatísticas.
 */
export function getDefaultProgress(): Progress {
  return {
    unlockedTables: [2],
    tableStats: {},
    totalAnswered: 0,
    totalCorrect: 0,
    randomStats: { totalAnswered: 0, totalCorrect: 0 },
  };
}

/**
 * Valida se um valor desconhecido é um StoredProgress válido.
 * Verifica: version === 1, unlockedTables é array de números 2-10,
 * tableStats tem estrutura válida com valores não-negativos.
 */
export function isValidStoredProgress(data: unknown): data is StoredProgress {
  if (data === null || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Validar version
  if (obj.version !== 1) return false;

  // Validar unlockedTables
  if (!Array.isArray(obj.unlockedTables)) return false;
  if (obj.unlockedTables.length === 0) return false;
  for (const table of obj.unlockedTables) {
    if (typeof table !== "number") return false;
    if (!Number.isInteger(table)) return false;
    if (table < 2 || table > 10) return false;
  }

  // Validar tableStats
  if (obj.tableStats === null || typeof obj.tableStats !== "object") return false;
  if (Array.isArray(obj.tableStats)) return false;

  const stats = obj.tableStats as Record<string, unknown>;
  for (const [key, value] of Object.entries(stats)) {
    // Chave deve ser um número de tabuada válido (2-10)
    const tableNum = Number(key);
    if (!Number.isInteger(tableNum) || tableNum < 2 || tableNum > 10) return false;

    // Valor deve ter totalAnswered e totalCorrect não-negativos
    if (value === null || typeof value !== "object") return false;
    const stat = value as Record<string, unknown>;
    if (typeof stat.totalAnswered !== "number" || typeof stat.totalCorrect !== "number")
      return false;
    if (!Number.isInteger(stat.totalAnswered) || !Number.isInteger(stat.totalCorrect))
      return false;
    if (stat.totalAnswered < 0 || stat.totalCorrect < 0) return false;
    if (stat.totalCorrect > stat.totalAnswered) return false;
  }

  return true;
}

/**
 * Converte StoredProgress → Progress, recalculando masteryLevel para cada tabuada
 * e computando os totais globais.
 */
export function reconstructProgress(stored: StoredProgress): Progress {
  let totalAnswered = 0;
  let totalCorrect = 0;

  const tableStats: Record<number, TableStats> = {};

  for (const [key, value] of Object.entries(stored.tableStats)) {
    const tableNumber = Number(key);
    const masteryLevel = calculateMasteryLevel(value.totalCorrect, value.totalAnswered);

    tableStats[tableNumber] = {
      tableNumber,
      totalAnswered: value.totalAnswered,
      totalCorrect: value.totalCorrect,
      masteryLevel,
    };

    totalAnswered += value.totalAnswered;
    totalCorrect += value.totalCorrect;
  }

  return {
    unlockedTables: stored.unlockedTables,
    tableStats,
    totalAnswered,
    totalCorrect,
    randomStats: stored.randomStats ?? { totalAnswered: 0, totalCorrect: 0 },
  };
}
