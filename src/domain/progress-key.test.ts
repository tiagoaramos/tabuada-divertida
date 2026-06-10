describe("progress-key", () => {
  describe("buildProgressKey", () => {
    it("builds key for addition-open", async () => {
      const { buildProgressKey } = await import("./progress-key");
      expect(buildProgressKey("addition", "open")).toBe("addition-open");
    });

    it("builds key for multiplication-multiple-choice", async () => {
      const { buildProgressKey } = await import("./progress-key");
      expect(buildProgressKey("multiplication", "multiple-choice")).toBe(
        "multiplication-multiple-choice"
      );
    });

    it("builds key for custom category", async () => {
      const { buildProgressKey } = await import("./progress-key");
      expect(buildProgressKey("subtraction", "open")).toBe("subtraction-open");
    });
  });

  describe("parseProgressKey", () => {
    it("parses addition-open correctly", async () => {
      const { parseProgressKey } = await import("./progress-key");
      const result = parseProgressKey("addition-open");
      expect(result).toEqual({ categoryId: "addition", questionTypeId: "open" });
    });

    it("parses multiplication-multiple-choice correctly", async () => {
      const { parseProgressKey } = await import("./progress-key");
      const result = parseProgressKey("multiplication-multiple-choice");
      expect(result).toEqual({
        categoryId: "multiplication",
        questionTypeId: "multiple-choice",
      });
    });

    it("parses category with hyphens correctly", async () => {
      const { parseProgressKey } = await import("./progress-key");
      const result = parseProgressKey("long-division-open");
      expect(result).toEqual({
        categoryId: "long-division",
        questionTypeId: "open",
      });
    });

    it("throws on invalid progress key", async () => {
      const { parseProgressKey } = await import("./progress-key");
      expect(() => parseProgressKey("invalid" as any)).toThrow(
        'Invalid ProgressKey: "invalid"'
      );
    });
  });

  describe("getStorageKey", () => {
    it("returns correct localStorage key pattern", async () => {
      const { getStorageKey, buildProgressKey } = await import("./progress-key");
      const key = buildProgressKey("addition", "open");
      expect(getStorageKey("student1", key)).toBe(
        "math-trainer-progress-student1-addition-open"
      );
    });

    it("returns correct key for multiplication-multiple-choice", async () => {
      const { getStorageKey, buildProgressKey } = await import("./progress-key");
      const key = buildProgressKey("multiplication", "multiple-choice");
      expect(getStorageKey("abc123", key)).toBe(
        "math-trainer-progress-abc123-multiplication-multiple-choice"
      );
    });

    it("handles student ID with special characters", async () => {
      const { getStorageKey, buildProgressKey } = await import("./progress-key");
      const key = buildProgressKey("addition", "open");
      expect(getStorageKey("1234-abcd", key)).toBe(
        "math-trainer-progress-1234-abcd-addition-open"
      );
    });
  });
});
