import {
  registerCategory,
  getCategory,
  getAllCategories,
  clearRegistry,
  type CategoryDefinition,
} from "./category-registry";

describe("category-registry", () => {
  // Save initial state and restore after each test
  let initialCategories: CategoryDefinition[];

  beforeEach(() => {
    initialCategories = getAllCategories();
    clearRegistry();
    // Re-register built-in categories for a clean state
    for (const cat of initialCategories) {
      registerCategory(cat);
    }
  });

  afterEach(() => {
    clearRegistry();
    for (const cat of initialCategories) {
      registerCategory(cat);
    }
  });

  describe("built-in categories", () => {
    it("should have addition and multiplication registered", () => {
      const addition = getCategory("addition");
      const multiplication = getCategory("multiplication");

      expect(addition).toBeDefined();
      expect(multiplication).toBeDefined();
    });

    it("addition category has correct metadata", () => {
      const addition = getCategory("addition")!;

      expect(addition.id).toBe("addition");
      expect(addition.label).toBe("Soma");
      expect(addition.operator).toBe("+");
      expect(addition.icon).toBe("addition");
      expect(addition.compute(3, 4)).toBe(7);
      expect(addition.compute(9, 10)).toBe(19);
    });

    it("multiplication category has correct metadata", () => {
      const multiplication = getCategory("multiplication")!;

      expect(multiplication.id).toBe("multiplication");
      expect(multiplication.label).toBe("Multiplicação");
      expect(multiplication.operator).toBe("×");
      expect(multiplication.icon).toBe("multiplication");
      expect(multiplication.compute(3, 4)).toBe(12);
      expect(multiplication.compute(9, 10)).toBe(90);
    });
  });

  describe("getAllCategories", () => {
    it("returns all registered categories", () => {
      const categories = getAllCategories();
      expect(categories).toHaveLength(2);
      expect(categories.map((c) => c.id)).toContain("addition");
      expect(categories.map((c) => c.id)).toContain("multiplication");
    });
  });

  describe("getCategory", () => {
    it("returns undefined for unregistered id", () => {
      expect(getCategory("subtraction")).toBeUndefined();
    });
  });

  describe("registerCategory - validation", () => {
    it("rejects empty id", () => {
      expect(() =>
        registerCategory({
          id: "",
          label: "Test",
          operator: "-",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("'id' is required and cannot be empty");
    });

    it("rejects id with uppercase characters", () => {
      expect(() =>
        registerCategory({
          id: "Subtraction",
          label: "Test",
          operator: "-",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("lowercase alphanumeric characters and hyphens");
    });

    it("rejects id longer than 32 characters", () => {
      expect(() =>
        registerCategory({
          id: "a".repeat(33),
          label: "Test",
          operator: "-",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("at most 32 characters");
    });

    it("rejects empty label", () => {
      expect(() =>
        registerCategory({
          id: "subtraction",
          label: "",
          operator: "-",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("'label' is required and cannot be empty");
    });

    it("rejects label longer than 50 characters", () => {
      expect(() =>
        registerCategory({
          id: "subtraction",
          label: "A".repeat(51),
          operator: "-",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("at most 50 characters");
    });

    it("rejects empty operator", () => {
      expect(() =>
        registerCategory({
          id: "subtraction",
          label: "Subtração",
          operator: "",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("'operator' is required and cannot be empty");
    });

    it("rejects operator longer than 3 characters", () => {
      expect(() =>
        registerCategory({
          id: "subtraction",
          label: "Subtração",
          operator: "----",
          icon: "test",
          compute: (a, b) => a - b,
        })
      ).toThrow("at most 3 characters");
    });

    it("rejects empty icon", () => {
      expect(() =>
        registerCategory({
          id: "subtraction",
          label: "Subtração",
          operator: "-",
          icon: "",
          compute: (a, b) => a - b,
        })
      ).toThrow("'icon' is required and cannot be empty");
    });

    it("rejects non-function compute", () => {
      expect(() =>
        registerCategory({
          id: "subtraction",
          label: "Subtração",
          operator: "-",
          icon: "test",
          compute: null as unknown as (a: number, b: number) => number,
        })
      ).toThrow("'compute' must be a function");
    });
  });

  describe("registerCategory - duplicate rejection", () => {
    it("rejects duplicate id", () => {
      expect(() =>
        registerCategory({
          id: "addition",
          label: "Another Addition",
          operator: "+",
          icon: "plus",
          compute: (a, b) => a + b,
        })
      ).toThrow("a category with id 'addition' already exists");
    });
  });

  describe("registerCategory - successful registration", () => {
    it("allows registering a new valid category", () => {
      registerCategory({
        id: "subtraction",
        label: "Subtração",
        operator: "-",
        icon: "subtraction",
        compute: (a, b) => a - b,
      });

      const cat = getCategory("subtraction");
      expect(cat).toBeDefined();
      expect(cat!.label).toBe("Subtração");
      expect(cat!.compute(10, 3)).toBe(7);
    });

    it("accepts id with hyphens", () => {
      registerCategory({
        id: "my-custom-op",
        label: "Custom",
        operator: "?",
        icon: "custom",
        compute: (a, b) => a + b,
      });

      expect(getCategory("my-custom-op")).toBeDefined();
    });
  });
});
