import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  createResponseTimeRecord,
  saveResponseTimeRecord,
  loadResponseTimeRecords,
  clearResponseTimeRecords,
  RESPONSE_TIMES_STORAGE_KEY,
} from "./response-times";
import type { Question, ResponseTimeRecord } from "../types";

const PROGRESS_STORAGE_KEY = "math-trainer-progress";

/**
 * Property 1: Criação de registro preserva dados da questão e produz campos válidos
 *
 * For any valid Question (factorA in 2-10, factorB in 1-10), for any elapsed time
 * (finite number >= 0), and for any boolean isCorrect value, the function
 * `createResponseTimeRecord` must produce a record where:
 * - tableNumber === question.factorA
 * - factorA and factorB match the question
 * - responseTimeMs is a non-negative integer
 * - isCorrect reflects the provided value
 * - timestamp is a valid ISO 8601 string
 *
 * **Validates: Requirements 1.2, 1.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */
describe("Property 1: Criação de registro preserva dados da questão e produz campos válidos", () => {
  const questionArb: fc.Arbitrary<Question> = fc
    .record({
      factorA: fc.integer({ min: 2, max: 10 }),
      factorB: fc.integer({ min: 1, max: 10 }),
    })
    .map(({ factorA, factorB }) => ({
      factorA,
      factorB,
      correctAnswer: factorA * factorB,
    }));

  const elapsedTimeArb = fc.double({ min: 0, max: 60000, noNaN: true });
  const isCorrectArb = fc.boolean();

  it("tableNumber equals question.factorA", () => {
    fc.assert(
      fc.property(questionArb, elapsedTimeArb, isCorrectArb, (question, elapsed, isCorrect) => {
        const record = createResponseTimeRecord(question, elapsed, isCorrect);
        expect(record.tableNumber).toBe(question.factorA);
      }),
      { numRuns: 100 }
    );
  });

  it("factorA and factorB match the question", () => {
    fc.assert(
      fc.property(questionArb, elapsedTimeArb, isCorrectArb, (question, elapsed, isCorrect) => {
        const record = createResponseTimeRecord(question, elapsed, isCorrect);
        expect(record.factorA).toBe(question.factorA);
        expect(record.factorB).toBe(question.factorB);
      }),
      { numRuns: 100 }
    );
  });

  it("responseTimeMs is a non-negative integer", () => {
    fc.assert(
      fc.property(questionArb, elapsedTimeArb, isCorrectArb, (question, elapsed, isCorrect) => {
        const record = createResponseTimeRecord(question, elapsed, isCorrect);
        expect(record.responseTimeMs).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(record.responseTimeMs)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("isCorrect reflects the provided value", () => {
    fc.assert(
      fc.property(questionArb, elapsedTimeArb, isCorrectArb, (question, elapsed, isCorrect) => {
        const record = createResponseTimeRecord(question, elapsed, isCorrect);
        expect(record.isCorrect).toBe(isCorrect);
      }),
      { numRuns: 100 }
    );
  });

  it("timestamp is a valid ISO 8601 string", () => {
    fc.assert(
      fc.property(questionArb, elapsedTimeArb, isCorrectArb, (question, elapsed, isCorrect) => {
        const record = createResponseTimeRecord(question, elapsed, isCorrect);
        expect(typeof record.timestamp).toBe("string");
        const parsed = Date.parse(record.timestamp);
        expect(isNaN(parsed)).toBe(false);
        // Verify it round-trips back to a valid Date
        const date = new Date(record.timestamp);
        expect(date.toISOString()).toBe(record.timestamp);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Arbitrary for generating valid ResponseTimeRecord objects.
 */
const responseTimeRecordArb: fc.Arbitrary<ResponseTimeRecord> = fc
  .record({
    tableNumber: fc.integer({ min: 2, max: 10 }),
    factorB: fc.integer({ min: 1, max: 10 }),
    responseTimeMs: fc.integer({ min: 0, max: 60000 }),
    isCorrect: fc.boolean(),
    timestamp: fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01"), noInvalidDate: true }),
  })
  .map(({ tableNumber, factorB, responseTimeMs, isCorrect, timestamp }) => ({
    tableNumber,
    factorA: tableNumber,
    factorB,
    responseTimeMs,
    isCorrect,
    timestamp: timestamp.toISOString(),
  }));

/**
 * Arbitrary that generates a random progress JSON string (simulating math-trainer-progress content).
 */
const progressJsonArb = fc
  .record({
    version: fc.constant(1),
    unlockedTables: fc.uniqueArray(fc.integer({ min: 2, max: 10 }), { minLength: 1 }),
    tableStats: fc.dictionary(
      fc.integer({ min: 2, max: 10 }).map(String),
      fc.record({
        totalAnswered: fc.integer({ min: 0, max: 1000 }),
        totalCorrect: fc.integer({ min: 0, max: 1000 }),
      }).filter((s) => s.totalCorrect <= s.totalAnswered)
    ),
  })
  .map((obj) => JSON.stringify(obj));

/**
 * Arbitrary that picks a response-times operation to perform.
 */
const operationArb = fc.oneof(
  fc.constant("load" as const),
  fc.constant("clear" as const),
  responseTimeRecordArb.map((record) => ({ type: "save" as const, record }))
);

describe("Property 4: Isolamento de storage — response times não afeta progress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * **Validates: Requirements 2.2, 3.3**
   *
   * For any valid progress state saved in `math-trainer-progress` and for any
   * write/read operation on `math-trainer-response-times`, the value stored in
   * `math-trainer-progress` must remain unchanged.
   */
  it("storage isolation — response times operations do not affect progress", () => {
    fc.assert(
      fc.property(
        progressJsonArb,
        fc.array(operationArb, { minLength: 1, maxLength: 5 }),
        (progressJson, operations) => {
          // Setup: clear localStorage and set a known progress value
          localStorage.clear();
          localStorage.setItem(PROGRESS_STORAGE_KEY, progressJson);

          // Act: perform response-times operations
          for (const op of operations) {
            if (op === "load") {
              loadResponseTimeRecords();
            } else if (op === "clear") {
              clearResponseTimeRecords();
            } else {
              saveResponseTimeRecord(op.record);
            }
          }

          // Assert: progress value must be unchanged
          const progressAfter = localStorage.getItem(PROGRESS_STORAGE_KEY);
          expect(progressAfter).toBe(progressJson);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 2: Round-trip de persistência de registros
 *
 * For any array of valid ResponseTimeRecords (with up to 1000 elements),
 * saving all records and then loading should produce an array equivalent
 * to the original.
 *
 * **Validates: Requirements 2.1**
 */
describe("Property 2: Round-trip de persistência de registros", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saving records one by one and loading produces the original array", () => {
    fc.assert(
      fc.property(
        fc.array(responseTimeRecordArb, { minLength: 0, maxLength: 20 }),
        (records) => {
          localStorage.clear();

          for (const record of records) {
            saveResponseTimeRecord(record);
          }

          const loaded = loadResponseTimeRecords();
          expect(loaded).toEqual(records);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Rolling window mantém no máximo 1000 registros
 *
 * For any sequence of N records saved (where N can be greater than 1000),
 * after persistence, stored records <= 1000 and are the most recent.
 *
 * **Validates: Requirements 2.3**
 */
describe("Property 3: Rolling window mantém no máximo 1000 registros", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stored records never exceed 1000 and are the most recent from the sequence", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 995, max: 1050 }),
        fc.integer({ min: 2, max: 10 }),
        fc.boolean(),
        (n, tableNumber, isCorrect) => {
          localStorage.clear();

          // Build all records
          const allRecords: ResponseTimeRecord[] = [];
          for (let i = 0; i < n; i++) {
            allRecords.push({
              tableNumber,
              factorA: tableNumber,
              factorB: (i % 10) + 1,
              responseTimeMs: i,
              isCorrect,
              timestamp: new Date(2024, 0, 1, 0, 0, i).toISOString(),
            });
          }

          // Pre-seed localStorage with the first (n - 10) records to avoid
          // calling saveResponseTimeRecord 1000+ times (which causes OOM)
          const preSeedCount = n - 10;
          const preSeedRecords = allRecords.slice(0, preSeedCount);
          localStorage.setItem(
            RESPONSE_TIMES_STORAGE_KEY,
            JSON.stringify(preSeedRecords)
          );

          // Save the remaining records one-by-one (triggers rolling window logic)
          for (let i = preSeedCount; i < n; i++) {
            saveResponseTimeRecord(allRecords[i]);
          }

          const loaded = loadResponseTimeRecords();

          // Count must be at most 1000
          expect(loaded.length).toBeLessThanOrEqual(1000);

          // Preserved records are the last 1000 from the original sequence
          const expected = allRecords.slice(Math.max(0, n - 1000));
          expect(loaded).toEqual(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Resiliência a falha de escrita
 *
 * If localStorage.setItem throws, `saveResponseTimeRecord` must NOT
 * propagate the exception.
 *
 * **Validates: Requirements 4.1**
 */
describe("Property 5: Resiliência a falha de escrita", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saveResponseTimeRecord does not throw when localStorage.setItem fails", () => {
    fc.assert(
      fc.property(responseTimeRecordArb, (record) => {
        const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
          throw new DOMException("QuotaExceededError", "QuotaExceededError");
        });

        try {
          expect(() => saveResponseTimeRecord(record)).not.toThrow();
        } finally {
          spy.mockRestore();
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Recuperação de dados corrompidos
 *
 * For corrupted localStorage data, `loadResponseTimeRecords` returns `[]`
 * without throwing.
 *
 * **Validates: Requirements 4.2**
 */
describe("Property 6: Recuperação de dados corrompidos", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array for random non-JSON strings", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (corrupted) => {
          localStorage.clear();
          localStorage.setItem(RESPONSE_TIMES_STORAGE_KEY, corrupted);

          const result = loadResponseTimeRecords();
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty array for valid JSON but non-array values", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer().map((n) => JSON.stringify(n)),
          fc.string().map((s) => JSON.stringify(s)),
          fc.boolean().map((b) => JSON.stringify(b)),
          fc.constant(JSON.stringify(null)),
          fc.dictionary(fc.string(), fc.integer()).map((o) => JSON.stringify(o))
        ),
        (jsonStr) => {
          localStorage.clear();
          localStorage.setItem(RESPONSE_TIMES_STORAGE_KEY, jsonStr);

          const result = loadResponseTimeRecords();
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty array for JSON arrays with invalid record objects", () => {
    const invalidRecordArb = fc.oneof(
      // Wrong types for fields
      fc.record({
        tableNumber: fc.string(),
        factorA: fc.integer(),
        factorB: fc.integer(),
        responseTimeMs: fc.integer({ min: 0 }),
        isCorrect: fc.boolean(),
        timestamp: fc.string(),
      }),
      // Out-of-range tableNumber
      fc.record({
        tableNumber: fc.oneof(fc.integer({ min: -100, max: 1 }), fc.integer({ min: 11, max: 100 })),
        factorA: fc.integer({ min: 2, max: 10 }),
        factorB: fc.integer({ min: 1, max: 10 }),
        responseTimeMs: fc.integer({ min: 0, max: 60000 }),
        isCorrect: fc.boolean(),
        timestamp: fc.constant("2024-01-01T00:00:00.000Z"),
      }),
      // Negative responseTimeMs
      fc.record({
        tableNumber: fc.integer({ min: 2, max: 10 }),
        factorA: fc.integer({ min: 2, max: 10 }),
        factorB: fc.integer({ min: 1, max: 10 }),
        responseTimeMs: fc.integer({ min: -10000, max: -1 }),
        isCorrect: fc.boolean(),
        timestamp: fc.constant("2024-01-01T00:00:00.000Z"),
      }),
      // Missing fields (empty object or partial)
      fc.constant({}),
      fc.constant({ tableNumber: 3 }),
      fc.constant(null)
    );

    fc.assert(
      fc.property(
        fc.array(invalidRecordArb, { minLength: 1, maxLength: 5 }),
        (invalidRecords) => {
          localStorage.clear();
          localStorage.setItem(RESPONSE_TIMES_STORAGE_KEY, JSON.stringify(invalidRecords));

          const result = loadResponseTimeRecords();
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
