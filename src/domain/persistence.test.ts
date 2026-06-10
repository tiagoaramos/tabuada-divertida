import { describe, it, expect, beforeEach } from "vitest";
import {
  saveProgress,
  loadProgress,
  getDefaultProgress,
  isValidStoredProgress,
  reconstructProgress,
  STORAGE_KEY,
  getStudentStorageKey,
  migrateProgressIfNeeded,
} from "./persistence";
import { buildProgressKey } from "./progress-key";
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

  describe("saveProgress (legacy)", () => {
    it("salva progresso no localStorage com formato StoredProgress", () => {
      const progress: Progress = {
        unlockedTables: [2, 3],
        tableStats: {
          2: { tableNumber: 2, totalAnswered: 15, totalCorrect: 12, masteryLevel: 80 },
        },
        totalAnswered: 15,
        totalCorrect: 12,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
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

    it("salva progresso com studentId (legacy)", () => {
      const progress: Progress = {
        unlockedTables: [2],
        tableStats: {},
        totalAnswered: 0,
        totalCorrect: 0,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      };

      saveProgress(progress, "student-1");

      const raw = localStorage.getItem(getStudentStorageKey("student-1"));
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw!);
      expect(stored.version).toBe(1);
    });
  });

  describe("saveProgress (Progress_Key-based)", () => {
    it("salva progresso usando key pattern math-trainer-progress-{studentId}-{categoryId}-{questionTypeId}", () => {
      const progress: Progress = {
        unlockedTables: [2, 3],
        tableStats: {
          2: { tableNumber: 2, totalAnswered: 10, totalCorrect: 8, masteryLevel: 80 },
        },
        totalAnswered: 10,
        totalCorrect: 8,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      };

      const progressKey = buildProgressKey("addition", "open");
      saveProgress(progress, "student-1", progressKey);

      const expectedKey = "math-trainer-progress-student-1-addition-open";
      const raw = localStorage.getItem(expectedKey);
      expect(raw).not.toBeNull();
      const stored = JSON.parse(raw!);
      expect(stored.version).toBe(1);
      expect(stored.unlockedTables).toEqual([2, 3]);
      expect(stored.tableStats["2"]).toEqual({ totalAnswered: 10, totalCorrect: 8 });
    });

    it("writing one Progress_Key does NOT overwrite another Progress_Key", () => {
      const progressA: Progress = {
        unlockedTables: [2, 3, 4],
        tableStats: {
          2: { tableNumber: 2, totalAnswered: 20, totalCorrect: 18, masteryLevel: 90 },
        },
        totalAnswered: 20,
        totalCorrect: 18,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      };

      const progressB: Progress = {
        unlockedTables: [2],
        tableStats: {},
        totalAnswered: 0,
        totalCorrect: 0,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      };

      const keyA = buildProgressKey("addition", "open");
      const keyB = buildProgressKey("multiplication", "open");

      saveProgress(progressA, "student-1", keyA);
      saveProgress(progressB, "student-1", keyB);

      // Key A should still be intact
      const rawA = localStorage.getItem("math-trainer-progress-student-1-addition-open");
      expect(rawA).not.toBeNull();
      const storedA = JSON.parse(rawA!);
      expect(storedA.unlockedTables).toEqual([2, 3, 4]);

      // Key B should have its own data
      const rawB = localStorage.getItem("math-trainer-progress-student-1-multiplication-open");
      expect(rawB).not.toBeNull();
      const storedB = JSON.parse(rawB!);
      expect(storedB.unlockedTables).toEqual([2]);
    });

    it("handles localStorage unavailability gracefully on save", () => {
      const progress: Progress = {
        unlockedTables: [2],
        tableStats: {},
        totalAnswered: 0,
        totalCorrect: 0,
        randomStats: { totalAnswered: 0, totalCorrect: 0 },
      };

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };

      const progressKey = buildProgressKey("addition", "open");
      // Should not throw
      expect(() => saveProgress(progress, "student-1", progressKey)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe("loadProgress (legacy)", () => {
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

  describe("loadProgress (Progress_Key-based)", () => {
    it("loads progress from key pattern math-trainer-progress-{studentId}-{categoryId}-{questionTypeId}", () => {
      const stored = {
        version: 1,
        unlockedTables: [2, 3, 4],
        tableStats: {
          "2": { totalAnswered: 20, totalCorrect: 16 },
          "3": { totalAnswered: 10, totalCorrect: 9 },
        },
      };
      const storageKey = "math-trainer-progress-student-1-addition-open";
      localStorage.setItem(storageKey, JSON.stringify(stored));

      const progressKey = buildProgressKey("addition", "open");
      const progress = loadProgress("student-1", progressKey);

      expect(progress.unlockedTables).toEqual([2, 3, 4]);
      expect(progress.tableStats[2].masteryLevel).toBe(80);
      expect(progress.tableStats[3].masteryLevel).toBe(90);
      expect(progress.totalAnswered).toBe(30);
      expect(progress.totalCorrect).toBe(25);
    });

    it("returns default progress when key is absent", () => {
      const progressKey = buildProgressKey("addition", "open");
      const progress = loadProgress("student-1", progressKey);
      expect(progress).toEqual(getDefaultProgress());
    });

    it("returns default progress when key contains unparseable JSON", () => {
      const storageKey = "math-trainer-progress-student-1-addition-open";
      localStorage.setItem(storageKey, "not-valid-json{{{");

      const progressKey = buildProgressKey("addition", "open");
      const progress = loadProgress("student-1", progressKey);
      expect(progress).toEqual(getDefaultProgress());
    });

    it("returns default progress when stored data fails validation", () => {
      const stored = {
        version: 2,
        unlockedTables: [],
      };
      const storageKey = "math-trainer-progress-student-1-multiplication-multiple-choice";
      localStorage.setItem(storageKey, JSON.stringify(stored));

      const progressKey = buildProgressKey("multiplication", "multiple-choice");
      const progress = loadProgress("student-1", progressKey);
      expect(progress).toEqual(getDefaultProgress());
    });

    it("invalid data for one key does NOT affect other keys", () => {
      // Save valid data for addition-open
      const validStored = {
        version: 1,
        unlockedTables: [2, 3],
        tableStats: {
          "2": { totalAnswered: 10, totalCorrect: 8 },
        },
      };
      localStorage.setItem(
        "math-trainer-progress-student-1-addition-open",
        JSON.stringify(validStored)
      );

      // Save invalid data for multiplication-open
      localStorage.setItem(
        "math-trainer-progress-student-1-multiplication-open",
        "corrupted!!!"
      );

      // Loading invalid key returns default
      const multKey = buildProgressKey("multiplication", "open");
      const multProgress = loadProgress("student-1", multKey);
      expect(multProgress).toEqual(getDefaultProgress());

      // Loading valid key still works
      const addKey = buildProgressKey("addition", "open");
      const addProgress = loadProgress("student-1", addKey);
      expect(addProgress.unlockedTables).toEqual([2, 3]);
      expect(addProgress.tableStats[2].totalAnswered).toBe(10);
    });

    it("round-trip: save then load produces equivalent progress", () => {
      const progress: Progress = {
        unlockedTables: [2, 3, 4, 5],
        tableStats: {
          2: { tableNumber: 2, totalAnswered: 30, totalCorrect: 27, masteryLevel: 90 },
          3: { tableNumber: 3, totalAnswered: 15, totalCorrect: 12, masteryLevel: 80 },
          4: { tableNumber: 4, totalAnswered: 10, totalCorrect: 8, masteryLevel: 80 },
        },
        totalAnswered: 55,
        totalCorrect: 47,
        randomStats: { totalAnswered: 5, totalCorrect: 4 },
      };

      const progressKey = buildProgressKey("addition", "multiple-choice");
      saveProgress(progress, "student-1", progressKey);
      const loaded = loadProgress("student-1", progressKey);

      expect(loaded.unlockedTables).toEqual(progress.unlockedTables);
      expect(loaded.totalAnswered).toBe(progress.totalAnswered);
      expect(loaded.totalCorrect).toBe(progress.totalCorrect);
      expect(loaded.randomStats).toEqual(progress.randomStats);
      // masteryLevel is recalculated from stored totals
      expect(loaded.tableStats[2].masteryLevel).toBe(90);
      expect(loaded.tableStats[3].masteryLevel).toBe(80);
      expect(loaded.tableStats[4].masteryLevel).toBe(80);
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

    it("rejeita unlockedTables com valores não-inteiros", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [2.5],
          tableStats: {},
        })
      ).toBe(false);
    });

    it("rejeita tableStats com valores não-inteiros", () => {
      expect(
        isValidStoredProgress({
          version: 1,
          unlockedTables: [2],
          tableStats: {
            "2": { totalAnswered: 5.5, totalCorrect: 3 },
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

  describe("migrateProgressIfNeeded", () => {
    it("migrates legacy key to new multiplication-open key", () => {
      const legacyData = JSON.stringify({
        version: 1,
        unlockedTables: [2, 3, 4],
        tableStats: {
          "2": { totalAnswered: 20, totalCorrect: 18 },
          "3": { totalAnswered: 10, totalCorrect: 9 },
        },
      });
      const legacyKey = "math-trainer-progress-student-1";
      localStorage.setItem(legacyKey, legacyData);

      migrateProgressIfNeeded("student-1");

      // Legacy key should be removed
      expect(localStorage.getItem(legacyKey)).toBeNull();

      // Data should be at new key
      const newKey = "math-trainer-progress-student-1-multiplication-open";
      expect(localStorage.getItem(newKey)).toBe(legacyData);
    });

    it("does nothing if legacy key does not exist", () => {
      migrateProgressIfNeeded("student-1");

      const newKey = "math-trainer-progress-student-1-multiplication-open";
      expect(localStorage.getItem(newKey)).toBeNull();
    });

    it("does NOT overwrite new key if it already has data", () => {
      const legacyData = JSON.stringify({
        version: 1,
        unlockedTables: [2, 3],
        tableStats: {},
      });
      const existingNewData = JSON.stringify({
        version: 1,
        unlockedTables: [2, 3, 4, 5],
        tableStats: {
          "2": { totalAnswered: 30, totalCorrect: 28 },
        },
      });

      const legacyKey = "math-trainer-progress-student-1";
      const newKey = "math-trainer-progress-student-1-multiplication-open";
      localStorage.setItem(legacyKey, legacyData);
      localStorage.setItem(newKey, existingNewData);

      migrateProgressIfNeeded("student-1");

      // New key should retain its existing data, NOT be overwritten
      expect(localStorage.getItem(newKey)).toBe(existingNewData);

      // Legacy key should still be removed
      expect(localStorage.getItem(legacyKey)).toBeNull();
    });

    it("removes legacy key even when new key already exists", () => {
      const legacyData = JSON.stringify({
        version: 1,
        unlockedTables: [2],
        tableStats: {},
      });
      const existingNewData = JSON.stringify({
        version: 1,
        unlockedTables: [2, 3],
        tableStats: {},
      });

      const legacyKey = "math-trainer-progress-student-1";
      const newKey = "math-trainer-progress-student-1-multiplication-open";
      localStorage.setItem(legacyKey, legacyData);
      localStorage.setItem(newKey, existingNewData);

      migrateProgressIfNeeded("student-1");

      expect(localStorage.getItem(legacyKey)).toBeNull();
    });

    it("handles errors gracefully without throwing", () => {
      const legacyKey = "math-trainer-progress-student-1";
      localStorage.setItem(legacyKey, "some-data");

      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };

      expect(() => migrateProgressIfNeeded("student-1")).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });
});
