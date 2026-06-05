# Design Document

## Overview

Este módulo adiciona rastreamento silencioso de tempo de resposta ao Math Multiplication Trainer. A arquitetura segue o padrão existente: um novo módulo de domínio (`response-times.ts`) com funções puras para criação de registros e persistência, integrado ao `PracticeScreen` via `useRef` para capturar timestamps sem re-renders. Nenhum contexto React adicional é necessário — o timer é local ao componente.

```
┌─────────────────────────────────────────────────┐
│              PracticeScreen (UI)                 │
│  ┌──────────────────────────────────────────┐   │
│  │  useRef<number>(startTime)               │   │
│  │  performance.now() → elapsed time        │   │
│  └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│        src/domain/response-times.ts             │
│  ┌──────────────────────────────────────────┐   │
│  │  createResponseTimeRecord()              │   │
│  │  saveResponseTimeRecord()                │   │
│  │  loadResponseTimeRecords()               │   │
│  │  clearResponseTimeRecords()              │   │
│  └──────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│   localStorage: "math-trainer-response-times"   │
└─────────────────────────────────────────────────┘
```

## Architecture

O módulo opera de forma completamente independente do sistema de progresso existente. A medição usa `performance.now()` (precisão sub-milissegundo, não afetada por alterações de relógio do sistema) em vez de `Date.now()`. O estado do timer é mantido em `useRef` dentro do `PracticeScreen`, evitando re-renders e mantendo a referência estável entre ciclos de renderização.

**Decisões Arquiteturais:**
- **Sem novo Context**: O timer é estado local efêmero — não precisa ser compartilhado entre componentes.
- **performance.now()**: Mais preciso que Date.now(), monotônico (não retrocede com ajustes de relógio).
- **Rolling window de 1000**: Previne crescimento ilimitado do localStorage (~200KB no pior caso).
- **Falha silenciosa**: Erros de localStorage nunca interrompem a experiência de prática.

## Components and Interfaces

### Novo Tipo: ResponseTimeRecord

```typescript
// Em src/types/index.ts
export interface ResponseTimeRecord {
  tableNumber: number;    // 2-10
  factorA: number;        // primeiro fator da multiplicação
  factorB: number;        // segundo fator da multiplicação
  responseTimeMs: number; // tempo de resposta em milissegundos (inteiro >= 0)
  isCorrect: boolean;     // se a resposta estava correta
  timestamp: string;      // ISO 8601 string do momento da submissão
}
```

### Novo Módulo: src/domain/response-times.ts

```typescript
import type { ResponseTimeRecord, Question } from "../types";

export const RESPONSE_TIMES_STORAGE_KEY = "math-trainer-response-times";
export const MAX_RECORDS = 1000;

/**
 * Cria um ResponseTimeRecord a partir dos dados da questão e timing.
 */
export function createResponseTimeRecord(
  question: Question,
  responseTimeMs: number,
  isCorrect: boolean,
  timestamp?: Date
): ResponseTimeRecord {
  const now = timestamp ?? new Date();
  return {
    tableNumber: question.factorA,
    factorA: question.factorA,
    factorB: question.factorB,
    responseTimeMs: Math.max(0, Math.round(responseTimeMs)),
    isCorrect,
    timestamp: now.toISOString(),
  };
}

/**
 * Salva um registro de tempo de resposta no localStorage.
 * Mantém no máximo MAX_RECORDS registros (rolling window).
 * Falha silenciosamente se localStorage não estiver disponível.
 */
export function saveResponseTimeRecord(record: ResponseTimeRecord): void {
  try {
    const records = loadResponseTimeRecords();
    records.push(record);
    // Aplicar rolling window: manter apenas os MAX_RECORDS mais recentes
    const trimmed = records.length > MAX_RECORDS
      ? records.slice(records.length - MAX_RECORDS)
      : records;
    localStorage.setItem(
      RESPONSE_TIMES_STORAGE_KEY,
      JSON.stringify(trimmed)
    );
  } catch {
    // Falha silenciosa — não interromper a sessão de prática
  }
}

/**
 * Carrega os registros de tempo de resposta do localStorage.
 * Retorna array vazio se dados ausentes, corrompidos ou inválidos.
 */
export function loadResponseTimeRecords(): ResponseTimeRecord[] {
  try {
    const raw = localStorage.getItem(RESPONSE_TIMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validação básica: filtrar registros inválidos
    if (!isValidResponseTimeArray(parsed)) {
      // Dados corrompidos — resetar para array vazio
      localStorage.removeItem(RESPONSE_TIMES_STORAGE_KEY);
      return [];
    }
    return parsed;
  } catch {
    // JSON inválido ou outro erro — resetar
    try {
      localStorage.removeItem(RESPONSE_TIMES_STORAGE_KEY);
    } catch {
      // Ignorar erro no removeItem
    }
    return [];
  }
}

/**
 * Limpa todos os registros de tempo de resposta.
 */
export function clearResponseTimeRecords(): void {
  try {
    localStorage.removeItem(RESPONSE_TIMES_STORAGE_KEY);
  } catch {
    // Falha silenciosa
  }
}

/**
 * Valida se um array parseado contém registros válidos.
 */
export function isValidResponseTimeArray(data: unknown[]): data is ResponseTimeRecord[] {
  return data.every(isValidResponseTimeRecord);
}

/**
 * Valida se um valor é um ResponseTimeRecord válido.
 */
export function isValidResponseTimeRecord(data: unknown): data is ResponseTimeRecord {
  if (data === null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.tableNumber !== "number" || !Number.isInteger(obj.tableNumber)) return false;
  if (obj.tableNumber < 2 || obj.tableNumber > 10) return false;

  if (typeof obj.factorA !== "number" || !Number.isInteger(obj.factorA)) return false;
  if (typeof obj.factorB !== "number" || !Number.isInteger(obj.factorB)) return false;

  if (typeof obj.responseTimeMs !== "number" || !Number.isInteger(obj.responseTimeMs)) return false;
  if (obj.responseTimeMs < 0) return false;

  if (typeof obj.isCorrect !== "boolean") return false;

  if (typeof obj.timestamp !== "string") return false;
  // Validar ISO 8601 básico
  if (isNaN(Date.parse(obj.timestamp))) return false;

  return true;
}
```

### Integração no PracticeScreen

```typescript
import { useRef } from "react";
import { createResponseTimeRecord, saveResponseTimeRecord } from "../domain/response-times";

// Dentro do componente PracticeScreen:
const startTimeRef = useRef<number>(0);

// Quando nova questão é exibida (no advanceSession ou mount):
useEffect(() => {
  if (currentQuestion) {
    startTimeRef.current = performance.now();
  }
}, [currentQuestion]);

// No handleAnswer, antes do feedback:
const handleAnswer = (answer: number) => {
  if (!currentQuestion || feedbackState.type !== "none") return;

  const elapsedMs = performance.now() - startTimeRef.current;
  const isCorrect = evaluateAnswer(currentQuestion, answer);

  // Criar e persistir registro de tempo de resposta
  const record = createResponseTimeRecord(currentQuestion, elapsedMs, isCorrect);
  saveResponseTimeRecord(record);

  // ... resto do fluxo existente (submitAnswer, setFeedbackState)
};
```

## Data Models

### Formato de Armazenamento

```typescript
// Chave no localStorage
const RESPONSE_TIMES_STORAGE_KEY = "math-trainer-response-times";

// Formato: JSON array de ResponseTimeRecord
// Exemplo:
[
  {
    "tableNumber": 3,
    "factorA": 3,
    "factorB": 7,
    "responseTimeMs": 4523,
    "isCorrect": true,
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  {
    "tableNumber": 5,
    "factorA": 5,
    "factorB": 4,
    "responseTimeMs": 8910,
    "isCorrect": false,
    "timestamp": "2024-01-15T10:30:15.000Z"
  }
]
```

**Constraints:**
- Máximo 1000 registros (rolling window — descarta os mais antigos)
- Tamanho máximo estimado: ~200KB (1000 registros × ~200 bytes cada)
- Completamente independente de `math-trainer-progress`

## Error Handling

| Cenário | Tratamento |
|---------|-----------|
| localStorage.setItem falha (quota excedida, modo privado) | `saveResponseTimeRecord` captura exceção e retorna silenciosamente |
| localStorage.getItem retorna null | `loadResponseTimeRecords` retorna `[]` |
| Dados corrompidos (JSON inválido) | `loadResponseTimeRecords` remove a chave e retorna `[]` |
| Array contém registros inválidos | `loadResponseTimeRecords` remove a chave e retorna `[]` |
| performance.now() retorna valor inesperado | `createResponseTimeRecord` usa `Math.max(0, ...)` para garantir não-negatividade |
| localStorage.removeItem falha durante cleanup | Exceção capturada e ignorada |

## Testing Strategy

### Testes de Propriedade (Property-Based Tests)
- Framework: Vitest + fast-check
- Mínimo 100 iterações por propriedade
- Foco nas 6 propriedades de corretude (funções puras de domínio em `response-times.ts`)
- Mock de localStorage para testes de persistência e falha

### Testes de Exemplo (Unit Tests)
- Framework: Vitest
- Testes de integração do PracticeScreen com timer (verificar que `useRef` é configurado)
- Testes de edge cases: responseTimeMs = 0, registros no limite de 1000

### Cobertura por Módulo

| Módulo | Tipo de Teste |
|--------|--------------|
| `createResponseTimeRecord` | Property tests (criação e validação de campos) |
| `saveResponseTimeRecord` | Property tests (round-trip, rolling window, resiliência) |
| `loadResponseTimeRecords` | Property tests (recuperação de dados corrompidos) |
| `isValidResponseTimeRecord` | Property tests (validação) |
| PracticeScreen integração | Example tests (timer starts/stops, record created) |

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como ponte entre especificações legíveis por humanos e garantias de corretude verificáveis por máquina.*

### Property 1: Criação de registro preserva dados da questão e produz campos válidos

*Para qualquer* Question válida (factorA em 2-10, factorB em 1-10), *para qualquer* tempo decorrido (número finito >= 0), e *para qualquer* valor booleano de isCorrect, a função `createResponseTimeRecord` deve produzir um registro onde: tableNumber === question.factorA, factorA e factorB correspondem à questão, responseTimeMs é um inteiro não-negativo, isCorrect reflete o valor fornecido, e timestamp é uma string ISO 8601 válida.

**Validates: Requirements 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 2: Round-trip de persistência de registros

*Para qualquer* array de ResponseTimeRecords válidos (com até 1000 elementos), salvar todos os registros e depois carregar deve produzir um array equivalente ao original.

**Validates: Requirements 2.1**

### Property 3: Rolling window mantém no máximo 1000 registros e preserva os mais recentes

*Para qualquer* sequência de N registros salvos (onde N pode ser maior que 1000), após a persistência, o número de registros armazenados deve ser no máximo 1000, e os registros preservados devem ser os N mais recentes da sequência original.

**Validates: Requirements 2.3**

### Property 4: Isolamento de storage — response times não afeta progress

*Para qualquer* estado de progresso válido salvo em `math-trainer-progress` e *para qualquer* operação de escrita/leitura em `math-trainer-response-times`, o valor armazenado em `math-trainer-progress` deve permanecer inalterado.

**Validates: Requirements 2.2, 3.3**

### Property 5: Resiliência a falha de escrita

*Para qualquer* ResponseTimeRecord válido, se localStorage.setItem lançar uma exceção, a função `saveResponseTimeRecord` não deve propagar a exceção (não deve lançar erro).

**Validates: Requirements 4.1**

### Property 6: Recuperação de dados corrompidos

*Para qualquer* string que não represente um JSON array válido de ResponseTimeRecords (JSON inválido, tipos incorretos, valores fora do domínio), a função `loadResponseTimeRecords` deve retornar um array vazio sem lançar exceções.

**Validates: Requirements 4.2**
