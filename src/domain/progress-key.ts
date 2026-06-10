/**
 * Progress Key utilities.
 *
 * A ProgressKey encodes the combination of a category and a question type
 * as a single string, used to partition progress, unlock state, and
 * localStorage keys.
 */

export type QuestionTypeId = "open" | "multiple-choice";

export type ProgressKey = `${string}-${QuestionTypeId}`;

const QUESTION_TYPE_IDS: QuestionTypeId[] = ["open", "multiple-choice"];

/**
 * Builds a ProgressKey from category and question type identifiers.
 * Example: buildProgressKey("addition", "open") → "addition-open"
 */
export function buildProgressKey(
  categoryId: string,
  questionTypeId: QuestionTypeId
): ProgressKey {
  return `${categoryId}-${questionTypeId}`;
}

/**
 * Parses a ProgressKey back into its category and question type components.
 * Since questionTypeId can contain a hyphen ("multiple-choice"), parsing
 * checks for known suffixes rather than splitting naively.
 */
export function parseProgressKey(key: ProgressKey): {
  categoryId: string;
  questionTypeId: QuestionTypeId;
} {
  for (const qType of QUESTION_TYPE_IDS) {
    const suffix = `-${qType}`;
    if (key.endsWith(suffix)) {
      const categoryId = key.slice(0, key.length - suffix.length);
      return { categoryId, questionTypeId: qType };
    }
  }

  // Fallback — should not happen with well-formed keys
  throw new Error(`Invalid ProgressKey: "${key}"`);
}

/**
 * Returns the localStorage key for a given student and progress key.
 * Pattern: "math-trainer-progress-{studentId}-{categoryId}-{questionTypeId}"
 */
export function getStorageKey(
  studentId: string,
  progressKey: ProgressKey
): string {
  const { categoryId, questionTypeId } = parseProgressKey(progressKey);
  return `math-trainer-progress-${studentId}-${categoryId}-${questionTypeId}`;
}
