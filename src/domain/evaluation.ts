import type { Question } from "../types";

/**
 * Avalia se a resposta do aluno está correta.
 * Retorna true se userAnswer é igual ao produto correto (factorA × factorB).
 */
export function evaluateAnswer(question: Question, userAnswer: number): boolean {
  return userAnswer === question.correctAnswer;
}
