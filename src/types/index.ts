// === Tipos de Domínio ===

export type QuestionTypeId = "open" | "multiple-choice";

export interface Question {
  factorA: number; // número da tabuada (2-10)
  factorB: number; // operando (1-10)
  correctAnswer: number; // category.compute(factorA, factorB)
  categoryId?: string; // e.g., "addition", "multiplication"
}

export interface TableStats {
  tableNumber: number; // 2-10
  totalAnswered: number;
  totalCorrect: number;
  masteryLevel: number; // percentual: totalCorrect / totalAnswered (0-100)
}

export interface Progress {
  unlockedTables: number[]; // ex: [2, 3, 4]
  tableStats: Record<number, TableStats>; // chave: número da tabuada
  totalAnswered: number;
  totalCorrect: number;
  randomStats: { totalAnswered: number; totalCorrect: number };
}

// === Tipos de Estado da Sessão ===

export type FeedbackState =
  | { type: "none" }
  | { type: "correct" }
  | { type: "incorrect"; correctAnswer: number };

export interface PracticeSession {
  tableNumber: number;
  questions: Question[]; // fila de questões da sessão
  currentIndex: number;
  feedbackState: FeedbackState;
}

export interface RandomPracticeSession {
  tableNumber: number; // tabela atual da questão (varia a cada pergunta)
  questions: Question[]; // fila de questões mistas
  currentIndex: number;
  feedbackState: FeedbackState;
  isRandom: true;
}

// === Tipos de Aluno ===

export interface Student {
  id: string;       // identificador único (gerado)
  name: string;     // nome do aluno
  createdAt: string; // ISO 8601
}

// === Tipos de Navegação ===

export type Screen =
  | { type: "student-select" }
  | { type: "category-select" }
  | { type: "question-type-select"; categoryId: string }
  | { type: "table-selection"; categoryId: string; questionTypeId: QuestionTypeId }
  | { type: "practice"; categoryId: string; questionTypeId: QuestionTypeId; tableNumber: number }
  | { type: "random-practice"; categoryId: string; questionTypeId: QuestionTypeId }
  | { type: "stats" }
  // Legacy variants (kept for backward compatibility during migration)
  | { type: "selection" };

// === Tipos de Rastreamento de Tempo de Resposta ===

export interface ResponseTimeRecord {
  tableNumber: number;    // 2-10
  factorA: number;        // primeiro fator da multiplicação
  factorB: number;        // segundo fator da multiplicação
  responseTimeMs: number; // tempo de resposta em milissegundos (inteiro >= 0)
  isCorrect: boolean;     // se a resposta estava correta
  timestamp: string;      // ISO 8601 string do momento da submissão
}

// === Tipos de Persistência ===

export interface StoredProgress {
  version: 1;
  unlockedTables: number[];
  tableStats: Record<string, { totalAnswered: number; totalCorrect: number }>;
  randomStats?: { totalAnswered: number; totalCorrect: number };
}
