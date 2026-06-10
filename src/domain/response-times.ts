import type { ResponseTimeRecord, Question } from "../types";

export const RESPONSE_TIMES_STORAGE_KEY = "math-trainer-response-times";
export const MAX_RECORDS = 1000;

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

export function saveResponseTimeRecord(record: ResponseTimeRecord): void {
  try {
    const records = loadResponseTimeRecords();
    records.push(record);
    const trimmed = records.length > MAX_RECORDS
      ? records.slice(records.length - MAX_RECORDS)
      : records;
    localStorage.setItem(RESPONSE_TIMES_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Silent failure
  }
}

export function loadResponseTimeRecords(): ResponseTimeRecord[] {
  try {
    const raw = localStorage.getItem(RESPONSE_TIMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (!isValidResponseTimeArray(parsed)) {
      localStorage.removeItem(RESPONSE_TIMES_STORAGE_KEY);
      return [];
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(RESPONSE_TIMES_STORAGE_KEY);
    } catch {
      // Ignore
    }
    return [];
  }
}

export function clearResponseTimeRecords(): void {
  try {
    localStorage.removeItem(RESPONSE_TIMES_STORAGE_KEY);
  } catch {
    // Silent failure
  }
}

export function isValidResponseTimeArray(data: unknown[]): data is ResponseTimeRecord[] {
  return data.every(isValidResponseTimeRecord);
}

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
  if (isNaN(Date.parse(obj.timestamp))) return false;
  return true;
}
