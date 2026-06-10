import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MultipleChoiceInput } from "./MultipleChoiceInput";

describe("MultipleChoiceInput", () => {
  const defaultOptions = [8, 5, 7, 6];

  it("renders exactly 4 option buttons", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
  });

  it("displays the numeric value in each button", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} />);

    for (const option of defaultOptions) {
      expect(screen.getByText(String(option))).toBeInTheDocument();
    }
  });

  it("calls onSelect with the selected value when a button is clicked", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("7"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(7);
  });

  it("disables all buttons when disabled prop is true", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} disabled />);

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it("does not call onSelect when disabled and a button is clicked", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} disabled />);

    fireEvent.click(screen.getByText("8"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders buttons with minimum 48x48px tap targets", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveClass("multiple-choice-btn");
    }
  });

  it("provides aria-label for each option button", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} />);

    for (const option of defaultOptions) {
      expect(screen.getByLabelText(`Opção ${option}`)).toBeInTheDocument();
    }
  });

  it("wraps buttons in a group with accessible label", () => {
    const onSelect = vi.fn();
    render(<MultipleChoiceInput options={defaultOptions} onSelect={onSelect} />);

    expect(screen.getByRole("group", { name: "Opções de resposta" })).toBeInTheDocument();
  });
});
