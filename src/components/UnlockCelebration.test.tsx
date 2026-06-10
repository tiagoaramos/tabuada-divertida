import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UnlockCelebration } from "./UnlockCelebration";

// Mock useProgress
const mockDismissCelebration = vi.fn();
let mockUnlockCelebration: number | null = null;
let mockCategoryId = "multiplication";
let mockQuestionTypeId = "open";

vi.mock("../context/ProgressContext", () => ({
  useProgress: () => ({
    unlockCelebration: mockUnlockCelebration,
    dismissCelebration: mockDismissCelebration,
    categoryId: mockCategoryId,
    questionTypeId: mockQuestionTypeId,
  }),
}));

describe("UnlockCelebration", () => {
  beforeEach(() => {
    mockDismissCelebration.mockClear();
    mockUnlockCelebration = null;
    mockCategoryId = "multiplication";
    mockQuestionTypeId = "open";
  });

  it("renders nothing when unlockCelebration is null", () => {
    mockUnlockCelebration = null;
    const { container } = render(<UnlockCelebration />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the modal with category and question type when a table is unlocked", () => {
    mockUnlockCelebration = 5;
    mockCategoryId = "multiplication";
    mockQuestionTypeId = "open";
    render(<UnlockCelebration />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Parabéns!")).toBeInTheDocument();
    expect(
      screen.getByText("Você desbloqueou a tabuada do 5 em Multiplicação - Questão Aberta!")
    ).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("displays addition category label correctly", () => {
    mockUnlockCelebration = 3;
    mockCategoryId = "addition";
    mockQuestionTypeId = "multiple-choice";
    render(<UnlockCelebration />);

    expect(
      screen.getByText("Você desbloqueou a tabuada do 3 em Soma - Múltipla Escolha!")
    ).toBeInTheDocument();
  });

  it("calls dismissCelebration when the continue button is clicked", () => {
    mockUnlockCelebration = 3;
    render(<UnlockCelebration />);

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(mockDismissCelebration).toHaveBeenCalledOnce();
  });

  it("calls dismissCelebration when Escape is pressed", () => {
    mockUnlockCelebration = 4;
    render(<UnlockCelebration />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockDismissCelebration).toHaveBeenCalledOnce();
  });

  it("has the correct aria attributes for accessibility", () => {
    mockUnlockCelebration = 7;
    render(<UnlockCelebration />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Celebração de desbloqueio");
  });

  it("displays the correct table number in the message", () => {
    mockUnlockCelebration = 10;
    mockCategoryId = "multiplication";
    mockQuestionTypeId = "open";
    render(<UnlockCelebration />);

    expect(
      screen.getByText("Você desbloqueou a tabuada do 10 em Multiplicação - Questão Aberta!")
    ).toBeInTheDocument();
  });
});
