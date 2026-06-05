import { describe, it, expect, beforeEach } from "vitest";
import {
  saveProgress,
  loadProgress,
  getDefaultProgress,
  isValidStoredProgress,
  reconstructProgress,
  STORAGE_KEY,
} from "./persistence";
import type { Progress } from "../types";

describe("persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getDefaultProgress", () => {
    it("retorna progresso com apenas tabuada 2 desbloqueada", () => {
      const progress = getDefaultProgress();
      expect(progress.unlockedTables).toEqual([2]);
      expect(progress.tableStats).toEqual({});
      expect(progress.totalAnswered).toBe(0);
      expect(progress.totalCorrect).toBe(0);
    });
  });

  describe("saveProgress", () => {
    it("salva progresso no localStorage com formato StoredProgress", () => {
      const progress: Progress = {
        unlockedTables: [2, 3],
        tableStats: {
          2: { tableNumber: 2, totalAnswered: 15, totalCorrect: 12, masteryLevel: 80 },
        },
        totalAnswered: 15,
        totalCorrect: 12,
      };

      saveProgress(progress);

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw!);
      expect(stored.version).toBe(1);
      expect(stored.unlockedTables).toEqual([2, 3]);
      expect(stored.tableStats["2"]).toEqual({ totalAnswered: 15, totalCorrect: 12 });
      // masteryLevel não deve ser armazenado
      expect(stored.tableStats["2"].masteryLevel).toBeUndefined();
    });
  });

  describe("loadProgress", () => {
    it("retorna estado padrão quando localStorage está vazio", () => {
      const progress = loadProgress();
      expect(progress).toEqual(getDefaultProgress());
    });

    it("retorna estado padrão quando dados são JSON inválido", () => {
      localStorage.setItem(STORAGE_KEY, "not-json{{{");
      const progress = loadProgress();
      expect(progress).toEqual(getDefaultProgress());
    });

    it("retorna estado padrão quando dados são inválidos", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, unlockedTables: [] }));
      const progress = loadProgress();
      expect(progress).toEqual(getDefaultProgress());
    });

    it("restaura progresso válido com masteryLevel recalculado", () => {
      const stored = {
        version: 1,
        unlockedTables: [2, 3],
        tableStats: {
          "2": { totalAnswered: 20, totalCorrect: 18 },
          "3": { totalAnswered: 5, totalCorrect: 3 },
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

      const progress = loadProgress();
      expect(progress.unlockedTables).toEqual([2, 3]);
      expect(progress.tableStats[2].masteryLevel).toBe(90); // Math.round(18/20*100)
      expect(progress.tableStats[3].masteryLevel).toBe(60); // Math.round(3/5*100)
      expect(progress.totalAnswered).toBe(25);
      expect(progress.totalCorrect).toBe(21);
    });
  });

  describe("isValidStoredProgress", () => {
    it("aceita estrutura válida", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [2, 3, 4],
          tableStats: {
            "2": { totalAnswered: 10, totalCorrect: 8 },
          },
        })
      ).toBe(true);
    });

    it("rejeita null", () => {
      expect(isValidStoredProgress(null)).toBe(false);
    });

    it("rejeita version diferente de 1", () => {
      expect(
        isValidStoredProgress({
          version: 2,
          unlockedTables: [2],
          tableStats: {},
        })
      ).toBe(false);
    });

    it("rejeita unlockedTables vazio", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [],
          tableStats: {},
        })
      ).toBe(false);
    });

    it("rejeita tabuada fora do intervalo 2-10", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [1],
          tableStats: {},
        })
      ).toBe(false);
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [11],
          tableStats: {},
        })
      ).toBe(false);
    });

    it("rejeita totalCorrect maior que totalAnswered", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [2],
          tableStats: {
            "2": { totalAnswered: 5, totalCorrect: 10 },
          },
        })
      ).toBe(false);
    });

    it("rejeita valores negativos em stats", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [2],
          tableStats: {
            "2": { totalAnswered: -1, totalCorrect: 0 },
          },
        })
      ).toBe(false);
    });

    it("rejeita chave de tableStats fora do intervalo 2-10", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [2],
          tableStats: {
            "1": { totalAnswered: 5, totalCorrect: 3 },
          },
        })
      ).toBe(false);
    });
  });

  describe("reconstructProgress", () => {
    it("converte StoredProgress em Progress com masteryLevel calculado", () => {
      const stored = {
        version: 1 as const,
        unlockedTables: [2, 3, 4],
        tableStats: {
          "2": { totalAnswered: 20, totalCorrect: 16 },
          "3": { totalAnswered: 10, totalCorrect: 9 },
        },
      };

      const progress = reconstructProgress(stored);

      expect(progress.unlockedTables).toEqual([2, 3, 4]);
      expect(progress.tableStats[2]).toEqual({
        tableNumber: 2,
        totalAnswered: 20,
        totalCorrect: 16,
        masteryLevel: 80,
      });
      expect(progress.tableStats[3]).toEqual({
        tableNumber: 3,
        totalAnswered: 10,
        totalCorrect: 9,
        masteryLevel: 90,
      });
      expect(progress.totalAnswered).toBe(30);
      expect(progress.totalCorrect).toBe(25);
    });

    it("retorna tableStats vazio quando stored não tem stats", () => {
      const stored = {
        version: 1 as const,
        unlockedTables: [2],
        tableStats: {},
      };

      const progress = reconstructProgress(stored);

      expect(progress.tableStats).toEqual({});
      expect(progress.totalAnswered).toBe(0);
      expect(progress.totalCorrect).toBe(0);
    });
  });
});
