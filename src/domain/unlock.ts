import type { TableStats } from "../types";

/**
 * Verifica se o aluno atingiu o limiar de desbloqueio para a tabuada.
 * Condições: pelo menos 10 questões respondidas E nível de domínio >= 80%.
 */
export function shouldUnlockNext(tableStats: TableStats): boolean {
  return tableStats.totalAnswered >= 10 && tableStats.masteryLevel >= 80;
}

/**
 * Retorna o número da próxima tabuada a ser desbloqueada,
 * ou null se todas já estão desbloqueadas (máximo é 10).
 */
export function getNextTableToUnlock(currentUnlocked: number[]): number | null {
  const maxUnlocked = Math.max(...currentUnlocked);
  return maxUnlocked < 10 ? maxUnlocked + 1 : null;
}
