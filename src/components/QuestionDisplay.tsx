import type { Question } from "../types";

interface QuestionDisplayProps {
  question: Question;
  operator?: string;  // defaults to "×" for backward compatibility
}

export function QuestionDisplay({ question, operator = "×" }: QuestionDisplayProps) {
  return (
    <div className="question-display">
      <span className="question-factor">{question.factorA}</span>
      <span className="question-operator">{operator}</span>
      <span className="question-factor">{question.factorB}</span>
      <span className="question-equals">=</span>
      <span className="question-placeholder">?</span>
    </div>
  );
}
