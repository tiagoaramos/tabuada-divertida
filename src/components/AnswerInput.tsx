import { useState, useRef, useEffect, type FormEvent } from "react";

interface AnswerInputProps {
  /** Called when user submits an answer */
  onSubmit: (answer: number) => void;
  /** Whether input is disabled (e.g., during feedback) */
  disabled?: boolean;
  /** Key to trigger re-focus when a new question appears */
  questionKey?: string | number;
}

export function AnswerInput({ onSubmit, disabled = false, questionKey }: AnswerInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on the input field when a new question appears
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [questionKey, disabled]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed === "" || disabled) return;

    const numericAnswer = parseInt(trimmed, 10);
    if (isNaN(numericAnswer)) return;

    onSubmit(numericAnswer);
    setValue("");
  };

  return (
    <form className="answer-input" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="number"
        className="answer-field"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder="?"
        aria-label="Sua resposta"
        autoComplete="off"
      />
      <button
        type="submit"
        className="answer-btn"
        disabled={disabled || value.trim() === ""}
        aria-label="Responder"
      >
        Responder ✓
      </button>
    </form>
  );
}
