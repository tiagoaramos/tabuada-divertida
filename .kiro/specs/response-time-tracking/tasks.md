# Implementation Plan: Response Time Tracking

## Overview

Add silent response time measurement to the Math Multiplication Trainer. Implementation follows the existing domain module pattern: a new `ResponseTimeRecord` type, a pure domain module (`response-times.ts`) for record creation and localStorage persistence, and minimal integration into `PracticeScreen` using `useRef` + `performance.now()`.

## Tasks

- [x] 1. Add type and create domain module
  - [x] 1.1 Add `ResponseTimeRecord` interface to `src/types/index.ts`
    - Add the `ResponseTimeRecord` interface with fields: tableNumber, factorA, factorB, responseTimeMs, isCorrect, timestamp
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 1.2 Create `src/domain/response-times.ts` with all domain functions
    - Implement `createResponseTimeRecord` — creates a record from question data and elapsed time
    - Implement `saveResponseTimeRecord` — persists to localStorage with rolling window (max 1000)
    - Implement `loadResponseTimeRecords` — loads and validates from localStorage, resets on corruption
    - Implement `clearResponseTimeRecords` — removes the storage key
    - Implement `isValidResponseTimeRecord` and `isValidResponseTimeArray` — validation helpers
    - Export constants `RESPONSE_TIMES_STORAGE_KEY` and `MAX_RECORDS`
    - _Requirements: 1.2, 1.3, 2.1, 2.3, 4.1, 4.2_

- [x] 2. Integrate timer into PracticeScreen
  - [x] 2.1 Add response time measurement to `src/components/PracticeScreen.tsx`
    - Add `useRef<number>` to store start time
    - Set `startTimeRef.current = performance.now()` when `currentQuestion` changes (via `useEffect`)
    - In `handleAnswer`, compute elapsed time, call `createResponseTimeRecord` and `saveResponseTimeRecord`
    - Ensure no visible UI changes — timer is completely invisible
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 3. Checkpoint - Verify integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write tests for the domain module
  - [x]* 4.1 Write property test: creation preserves question data and produces valid fields
    - **Property 1: Criação de registro preserva dados da questão e produz campos válidos**
    - **Validates: Requirements 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  - [x]* 4.2 Write property test: round-trip persistence
    - **Property 2: Round-trip de persistência de registros**
    - **Validates: Requirements 2.1**

  - [x]* 4.3 Write property test: rolling window caps at 1000 records
    - **Property 3: Rolling window mantém no máximo 1000 registros e preserva os mais recentes**
    - **Validates: Requirements 2.3**

  - [x]* 4.4 Write property test: storage isolation from progress
    - **Property 4: Isolamento de storage — response times não afeta progress**
    - **Validates: Requirements 2.2, 3.3**

  - [x]* 4.5 Write property test: resilience to write failures
    - **Property 5: Resiliência a falha de escrita**
    - **Validates: Requirements 4.1**

  - [x]* 4.6 Write property test: corrupted data recovery
    - **Property 6: Recuperação de dados corrompidos**
    - **Validates: Requirements 4.2**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all existing and new tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The implementation uses TypeScript with Vitest + fast-check for property tests
- No new React context is needed — timer state is local to PracticeScreen via useRef

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"] }
  ]
}
```
