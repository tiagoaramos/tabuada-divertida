import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategorySelectorScreen } from "./CategorySelectorScreen";

// Mock useProgress
const mockSetCategoryId = vi.fn();
const mockNavigateTo = vi.fn();

vi.mock("../context/ProgressContext", () => ({
  useProgress: () => ({
    setCategoryId: mockSetCategoryId,
    navigateTo: mockNavigateTo,
  }),
}));

// Mock category-registry (default: returns two built-in categories)
const mockGetAllCategories = vi.fn();

vi.mock("../domain/category-registry", () => ({
  getAllCategories: () => mockGetAllCategories(),
}));

const builtInCategories = [
  { id: "addition", label: "Soma", operator: "+", icon: "addition", compute: (a: number, b: number) => a + b },
  { id: "multiplication", label: "Multiplicação", operator: "×", icon: "multiplication", compute: (a: number, b: number) => a * b },
];

describe("CategorySelectorScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllCategories.mockReturnValue(builtInCategories);
  });

  it("renders a selectable option for each registered category", () => {
    render(<CategorySelectorScreen />);
    expect(screen.getByText("Soma")).toBeInTheDocument();
    expect(screen.getByText("Multiplicação")).toBeInTheDocument();
  });

  it("displays category operator as icon", () => {
    render(<CategorySelectorScreen />);
    expect(screen.getByText("+")).toBeInTheDocument();
    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("renders the title 'Escolha a Operação'", () => {
    render(<CategorySelectorScreen />);
    expect(screen.getByText("Escolha a Operação")).toBeInTheDocument();
  });

  it("calls setCategoryId and navigates to question-type-select on category click", () => {
    render(<CategorySelectorScreen />);

    fireEvent.click(screen.getByText("Soma"));

    expect(mockSetCategoryId).toHaveBeenCalledWith("addition");
    expect(mockNavigateTo).toHaveBeenCalledWith({
      type: "question-type-select",
      categoryId: "addition",
    });
  });

  it("navigates correctly for multiplication category", () => {
    render(<CategorySelectorScreen />);

    fireEvent.click(screen.getByText("Multiplicação"));

    expect(mockSetCategoryId).toHaveBeenCalledWith("multiplication");
    expect(mockNavigateTo).toHaveBeenCalledWith({
      type: "question-type-select",
      categoryId: "multiplication",
    });
  });

  it("shows 'Nenhuma categoria disponível' when registry is empty", () => {
    mockGetAllCategories.mockReturnValue([]);
    render(<CategorySelectorScreen />);

    expect(screen.getByText("Nenhuma categoria disponível")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("renders buttons with minimum 48x48px tap target class", () => {
    render(<CategorySelectorScreen />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    buttons.forEach((btn) => {
      expect(btn).toHaveClass("category-screen__option");
    });
  });
});
