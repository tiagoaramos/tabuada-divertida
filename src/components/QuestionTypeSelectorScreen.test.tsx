import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionTypeSelectorScreen } from "./QuestionTypeSelectorScreen";

// Mock useProgress
const mockSetQuestionTypeId = vi.fn();
const mockNavigateTo = vi.fn();

vi.mock("../context/ProgressContext", () => ({
  useProgress: () => ({
    setQuestionTypeId: mockSetQuestionTypeId,
    navigateTo: mockNavigateTo,
  }),
}));

describe("QuestionTypeSelectorScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the category name from the registry", () => {
    render(<QuestionTypeSelectorScreen categoryId="addition" />);
    expect(screen.getByText("Soma")).toBeInTheDocument();
  });

  it("displays multiplication category name", () => {
    render(<QuestionTypeSelectorScreen categoryId="multiplication" />);
    expect(screen.getByText("Multiplicação")).toBeInTheDocument();
  });

  it("renders two question type options", () => {
    render(<QuestionTypeSelectorScreen categoryId="addition" />);
    expect(screen.getByText("Questão Aberta")).toBeInTheDocument();
    expect(screen.getByText("Múltipla Escolha")).toBeInTheDocument();
  });

  it("displays descriptions for each option (max 60 chars)", () => {
    render(<QuestionTypeSelectorScreen categoryId="addition" />);
    const openDesc = screen.getByText("Digite a resposta numérica");
    const mcDesc = screen.getByText("Escolha entre 4 opções");
    expect(openDesc).toBeInTheDocument();
    expect(mcDesc).toBeInTheDocument();
    // Verify descriptions are within 60 chars
    expect(openDesc.textContent!.length).toBeLessThanOrEqual(60);
    expect(mcDesc.textContent!.length).toBeLessThanOrEqual(60);
  });

  it("navigates to table-selection with open question type on 'Questão Aberta' click", () => {
    render(<QuestionTypeSelectorScreen categoryId="addition" />);

    fireEvent.click(screen.getByText("Questão Aberta"));

    expect(mockSetQuestionTypeId).toHaveBeenCalledWith("open");
    expect(mockNavigateTo).toHaveBeenCalledWith({
      type: "table-selection",
      categoryId: "addition",
      questionTypeId: "open",
    });
  });

  it("navigates to table-selection with multiple-choice question type on 'Múltipla Escolha' click", () => {
    render(<QuestionTypeSelectorScreen categoryId="multiplication" />);

    fireEvent.click(screen.getByText("Múltipla Escolha"));

    expect(mockSetQuestionTypeId).toHaveBeenCalledWith("multiple-choice");
    expect(mockNavigateTo).toHaveBeenCalledWith({
      type: "table-selection",
      categoryId: "multiplication",
      questionTypeId: "multiple-choice",
    });
  });

  it("renders buttons with minimum 48x48px tap target", () => {
    render(<QuestionTypeSelectorScreen categoryId="addition" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    // Buttons have the class that enforces min 48px via CSS
    buttons.forEach((btn) => {
      expect(btn).toHaveClass("question-type-screen__option");
    });
  });

  it("falls back to categoryId when category is not found in registry", () => {
    render(<QuestionTypeSelectorScreen categoryId="unknown-category" />);
    expect(screen.getByText("unknown-category")).toBeInTheDocument();
  });
});
