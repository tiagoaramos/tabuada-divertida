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

// === Tipos de Navegação ===

export type Screen =
  | { type: "selection" }
  | { type: "practice"; tableNumber: number }
  | { type: "random-practice" }
  | { type: "stats" };

// === Tipos de Persistência ===

export interface StoredProgress {
  version: 1;
  unlockedTables: number[];
  tableStats: Record<string, { totalAnswered: number; totalCorrect: number }>;
  randomStats?: { totalAnswered: number; totalCorrect: number };
}
