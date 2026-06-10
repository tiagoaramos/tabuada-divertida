/**
 * Category Registry — defines available operation categories and their metadata.
 * Adding a new category requires only a new `registerCategory()` call.
 */

export interface CategoryDefinition {
  id: string;               // e.g., "addition", "multiplication"
  label: string;            // e.g., "Soma", "Multiplicação"
  operator: string;         // e.g., "+", "×"
  icon: string;             // icon identifier
  compute: (a: number, b: number) => number;
}

const ID_PATTERN = /^[a-z0-9-]+$/;
const ID_MAX_LENGTH = 32;
const LABEL_MAX_LENGTH = 50;
const OPERATOR_MAX_LENGTH = 3;

const registry = new Map<string, CategoryDefinition>();

/**
 * Validates a category definition and registers it in the registry.
 * Throws if validation fails or if the id already exists.
 */
export function registerCategory(definition: CategoryDefinition): void {
  // Validate id
  if (!definition.id || definition.id.trim().length === 0) {
    throw new Error("Category registration failed: 'id' is required and cannot be empty");
  }
  if (definition.id.length > ID_MAX_LENGTH) {
    throw new Error(
      `Category registration failed: 'id' must be at most ${ID_MAX_LENGTH} characters (got ${definition.id.length})`
    );
  }
  if (!ID_PATTERN.test(definition.id)) {
    throw new Error(
      "Category registration failed: 'id' must contain only lowercase alphanumeric characters and hyphens"
    );
  }

  // Validate label
  if (!definition.label || definition.label.trim().length === 0) {
    throw new Error("Category registration failed: 'label' is required and cannot be empty");
  }
  if (definition.label.length > LABEL_MAX_LENGTH) {
    throw new Error(
      `Category registration failed: 'label' must be at most ${LABEL_MAX_LENGTH} characters (got ${definition.label.length})`
    );
  }

  // Validate operator
  if (!definition.operator || definition.operator.trim().length === 0) {
    throw new Error("Category registration failed: 'operator' is required and cannot be empty");
  }
  if (definition.operator.length > OPERATOR_MAX_LENGTH) {
    throw new Error(
      `Category registration failed: 'operator' must be at most ${OPERATOR_MAX_LENGTH} characters (got ${definition.operator.length})`
    );
  }

  // Validate icon
  if (!definition.icon || definition.icon.trim().length === 0) {
    throw new Error("Category registration failed: 'icon' is required and cannot be empty");
  }

  // Validate compute
  if (typeof definition.compute !== "function") {
    throw new Error("Category registration failed: 'compute' must be a function");
  }

  // Check for duplicate
  if (registry.has(definition.id)) {
    throw new Error(
      `Category registration failed: a category with id '${definition.id}' already exists`
    );
  }

  registry.set(definition.id, definition);
}

/**
 * Returns the category definition for the given id, or undefined if not found.
 */
export function getCategory(id: string): CategoryDefinition | undefined {
  return registry.get(id);
}

/**
 * Returns all registered category definitions as an array.
 */
export function getAllCategories(): CategoryDefinition[] {
  return Array.from(registry.values());
}

/**
 * Clears the registry. Intended for testing only.
 */
export function clearRegistry(): void {
  registry.clear();
}

// --- Register built-in categories ---

registerCategory({
  id: "addition",
  label: "Soma",
  operator: "+",
  icon: "addition",
  compute: (a, b) => a + b,
});

registerCategory({
  id: "multiplication",
  label: "Multiplicação",
  operator: "×",
  icon: "multiplication",
  compute: (a, b) => a * b,
});
