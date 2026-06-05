# Design Document

## Overview

A aplicação é um SPA (Single Page Application) construído com React + TypeScript usando Vite como bundler. Toda a lógica reside no cliente, sem backend. A persistência é feita via localStorage. A arquitetura segue um modelo de componentes com separação entre lógica pura (funções de domínio) e componentes de UI.

```
┌─────────────────────────────────────────────────┐
│                   App Shell                      │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │  Seleção de │  │   Prática   │  │ Stats  │  │
│  │  Tabuadas   │  │  (Questões) │  │        │  │
│  └─────────────┘  └─────────────┘  └────────┘  │
├─────────────────────────────────────────────────┤
│              Camada de Estado (Context)          │
├─────────────────────────────────────────────────┤
│           Camada de Domínio (Funções Puras)      │
├─────────────────────────────────────────────────┤
│           Camada de Persistência (localStorage)  │
└─────────────────────────────────────────────────┘
```

## Architecture

A aplicação segue uma arquitetura em camadas com separação entre UI (React components), estado global (Context API), lógica de domínio (funções puras) e persistência (localStorage). Não há backend — todo o processamento ocorre no cliente.

## Components and Interfaces

### Hierarquia de Componentes

```
App
├── Header (logo, navegação simples)
├── TableSelectionScreen (tela de seleção de tabuadas)
│   └── TableCard (card individual por tabuada)
├── PracticeScreen (tela de prática)
│   ├── QuestionDisplay (exibição da questão A × B = ?)
│   ├── AnswerInput (campo de entrada + botão de confirmação)
│   └── FeedbackOverlay (feedback de acerto/erro)
├── StatsScreen (tela de estatísticas)
│   ├── OverallStats (estatísticas gerais)
│   └── TableStats (estatísticas por tabuada)
└── UnlockCelebration (modal de conquista ao desbloquear)
```

### Componentes Principais

#### App
- Gerencia o roteamento entre telas (useState para navegação simples)
- Provê o contexto global de progresso
- Telas: `"selection"` | `"practice"` | `"stats"`

#### TableSelectionScreen
- Renderiza 9 cards (tabuadas de 2 a 10)
- Cards desbloqueados: coloridos, mostram nível de domínio
- Cards bloqueados: visual de cadeado (🔒), não clicáveis
- Botão para acessar estatísticas

#### PracticeScreen
- Recebe a tabuada selecionada como prop
- Gerencia o estado da sessão (questões restantes, questão atual)
- Exibe a questão, recebe resposta, aplica feedback
- Timer para feedback (1.5s acerto, 3s erro)

#### FeedbackOverlay
- Exibe feedback de acerto (🌟, animação de celebração, 1.5s)
- Exibe feedback de erro (resposta correta, mensagem encorajadora, 3s)
- Avança automaticamente para próxima questão após timeout

#### UnlockCelebration
- Modal com animação de troféu (🏆) ao desbloquear nova tabuada
- Botão para continuar

## Interfaces e Tipos

```typescript
// === Tipos de Domínio ===

interface Question {
  factorA: number; // número da tabuada (2-10)
  factorB: number; // multiplicador (1-10)
  correctAnswer: number; // factorA * factorB
}

interface TableStats {
  tableNumber: number; // 2-10
  totalAnswered: number;
  totalCorrect: number;
  masteryLevel: number; // percentual: totalCorrect / totalAnswered (0-100)
}

interface Progress {
  unlockedTables: number[]; // ex: [2, 3, 4]
  tableStats: Record<number, TableStats>; // chave: número da tabuada
  totalAnswered: number;
  totalCorrect: number;
}

// === Tipos de Estado da Sessão ===

type FeedbackState =
  | { type: "none" }
  | { type: "correct" }
  | { type: "incorrect"; correctAnswer: number };

interface PracticeSession {
  tableNumber: number;
  questions: Question[]; // fila de questões da sessão
  currentIndex: number;
  feedbackState: FeedbackState;
}

// === Tipos de Navegação ===

type Screen =
  | { type: "selection" }
  | { type: "practice"; tableNumber: number }
  | { type: "stats" };
```

## Data Models

```typescript
// Chave no localStorage
const STORAGE_KEY = "math-trainer-progress";

// Formato armazenado (JSON serializado)
interface StoredProgress {
  version: 1;
  unlockedTables: number[];
  tableStats: Record<string, { totalAnswered: number; totalCorrect: number }>;
}
```

O campo `version` permite migrações futuras do esquema.

## Camada de Domínio (Funções Puras)

Estas funções concentram toda a lógica testável, separada dos componentes React:

```typescript
// === Avaliação de Respostas ===

function evaluateAnswer(question: Question, userAnswer: number): boolean {
  return userAnswer === question.correctAnswer;
}

// === Lógica de Desbloqueio ===

function shouldUnlockNext(tableStats: TableStats): boolean {
  return tableStats.totalAnswered >= 10 && tableStats.masteryLevel >= 80;
}

function getNextTableToUnlock(currentUnlocked: number[]): number | null {
  const maxUnlocked = Math.max(...currentUnlocked);
  return maxUnlocked < 10 ? maxUnlocked + 1 : null;
}

// === Geração de Questões ===

function generateSessionQuestions(tableNumber: number): Question[] {
  const factors = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  return factors.map((b) => ({
    factorA: tableNumber,
    factorB: b,
    correctAnswer: tableNumber * b,
  }));
}

function getNextQuestion(
  session: PracticeSession
): { question: Question; updatedSession: PracticeSession } | null {
  // Se esgotou o ciclo, gera novo ciclo evitando repetição com última questão
  // Retorna null se não há próxima (não deve ocorrer, ciclo reinicia)
}

// === Cálculo de Estatísticas ===

function calculateMasteryLevel(totalCorrect: number, totalAnswered: number): number {
  if (totalAnswered === 0) return 0;
  return Math.round((totalCorrect / totalAnswered) * 100);
}

function calculateOverallStats(progress: Progress): {
  totalAnswered: number;
  totalCorrect: number;
  overallPercentage: number;
} {
  return {
    totalAnswered: progress.totalAnswered,
    totalCorrect: progress.totalCorrect,
    overallPercentage: calculateMasteryLevel(progress.totalCorrect, progress.totalAnswered),
  };
}

// === Persistência ===

function saveProgress(progress: Progress): void {
  const stored: StoredProgress = {
    version: 1,
    unlockedTables: progress.unlockedTables,
    tableStats: Object.fromEntries(
      Object.entries(progress.tableStats).map(([key, val]) => [
        key,
        { totalAnswered: val.totalAnswered, totalCorrect: val.totalCorrect },
      ])
    ),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw) as StoredProgress;
    if (!isValidStoredProgress(parsed)) return getDefaultProgress();
    return reconstructProgress(parsed);
  } catch {
    return getDefaultProgress();
  }
}

function getDefaultProgress(): Progress {
  return {
    unlockedTables: [2],
    tableStats: {},
    totalAnswered: 0,
    totalCorrect: 0,
  };
}

function isValidStoredProgress(data: unknown): data is StoredProgress {
  // Valida estrutura: version === 1, unlockedTables é array de números 2-10, etc.
}
```

## Fluxo de Dados

### Fluxo de Resposta a Questão

```
Aluno digita resposta → AnswerInput.onSubmit
  → evaluateAnswer(question, answer)
  → Atualiza tableStats no contexto
  → shouldUnlockNext(updatedStats)?
    → Sim: desbloqueia próxima, exibe UnlockCelebration
    → Não: continua
  → Define feedbackState ("correct" ou "incorrect")
  → saveProgress(updatedProgress)
  → setTimeout(avançar questão, 1500ms ou 3000ms)
```

### Fluxo de Inicialização

```
App monta
  → loadProgress() do localStorage
  → Se válido: restaura estado
  → Se inválido/ausente: getDefaultProgress()
  → Renderiza TableSelectionScreen
```

## Error Handling

| Cenário | Tratamento |
|---------|-----------|
| localStorage indisponível | Opera sem persistência (estado apenas em memória) |
| Dados corrompidos no localStorage | Retorna estado padrão via `getDefaultProgress()` |
| Input não-numérico | Campo `type="number"` previne entrada; validação extra antes de avaliar |
| Tabuada 10 já desbloqueada | `getNextTableToUnlock` retorna `null`, sem desbloqueio |

## Testing Strategy

### Testes de Propriedade (Property-Based Tests)
- Framework: Vitest + fast-check
- Mínimo 100 iterações por propriedade
- Foco nas 6 propriedades de corretude definidas abaixo (funções puras de domínio)

### Testes de Exemplo (Unit Tests)
- Framework: Vitest + React Testing Library
- Foco em interações de UI: feedback visual, temporização, navegação
- Testes de renderização: cards, estados bloqueado/desbloqueado, emojis

### Decisões Técnicas

1. **Navegação por estado (sem React Router):** Com apenas 2 níveis de profundidade, `useState<Screen>` é suficiente.
2. **Context API para estado global:** Um único `ProgressContext` provê o progresso para todos os componentes.
3. **Funções puras extraídas:** Toda lógica de avaliação, desbloqueio, geração e estatísticas em funções puras para facilitar testes.
4. **CSS Modules ou styled-components:** Estilos componentizados para manter o visual lúdico sem conflitos.
5. **Emojis nativos:** Sem dependência de bibliotecas de ícones — emojis Unicode (🌟🏆🔒) funcionam em todos os navegadores modernos.

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de corretude verificáveis por máquina.*

### Property 1: Avaliação de respostas é matematicamente correta

*Para qualquer* par de fatores A (2-10) e B (1-10), e *para qualquer* resposta numérica R fornecida pelo aluno, a função de avaliação deve retornar `true` se e somente se R é igual ao produto A × B.

**Validates: Requirements 1.3**

### Property 2: Lógica de desbloqueio respeita o limiar

*Para qualquer* tabuada N (2-9) e *para qualquer* histórico de respostas, a próxima tabuada (N+1) deve ser desbloqueada se e somente se o aluno respondeu pelo menos 10 questões da tabuada N com pelo menos 80% de acerto.

**Validates: Requirements 4.2**

### Property 3: Round-trip de persistência de progresso

*Para qualquer* estado de progresso válido (com tabuadas desbloqueadas de 2 a K onde 2 ≤ K ≤ 10, e estatísticas com valores não-negativos), salvar no localStorage e depois carregar deve produzir um estado equivalente ao original.

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 4: Dados corrompidos resultam em estado padrão

*Para qualquer* string que não represente um `StoredProgress` válido (JSON inválido, campos ausentes, valores fora do domínio), a função de carregamento deve retornar o estado padrão (apenas tabuada 2 desbloqueada, sem estatísticas).

**Validates: Requirements 6.4**

### Property 5: Cálculo de estatísticas é matematicamente correto

*Para qualquer* histórico de respostas (sequência de pares tabuada + acerto/erro), o total de questões respondidas deve ser a soma das respostas, o total de acertos deve ser a soma dos acertos, e o percentual deve ser `Math.round((acertos / total) * 100)`. As estatísticas por tabuada devem seguir a mesma fórmula aplicada individualmente.

**Validates: Requirements 7.1, 7.2**

### Property 6: Geração de questões é completa e sem repetição consecutiva

*Para qualquer* tabuada selecionada (2-10) e *para qualquer* ciclo de questões gerado, o ciclo deve conter exatamente os 10 fatores (1 a 10) sem omissão, e nenhum par de questões consecutivas (incluindo a transição entre ciclos) deve ser idêntico.

**Validates: Requirements 10.1, 10.2, 10.3**
