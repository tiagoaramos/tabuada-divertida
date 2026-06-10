// === Tipos de Domínio ===

export interface Question {
  factorA: number; // número da tabuada (2-10)
  factorB: number; // multiplicador (1-10)
  correctAnswer: number; // factorA * factorB
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
  | { type: "selection" }
  | { type: "practice"; tableNumber: number }
  | { type: "random-practice" }
  | { type: "stats" };

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
